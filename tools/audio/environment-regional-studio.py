"""Issue #709 — four independent LONG-FORM recorded-source environmental STUDIES.

Does NOT edit game catalog, original ambience, score, mixer or builds.
Checks real input bytes/licenses against reviewed ledger; renders/encodes four
candidate MP3s; decodes the actual outputs; records acoustic metrics; uploads
only through a separate NO-DEPLOY workflow. Python numpy + FFmpeg/FFprobe.

Field ambience has one real physical recording as primary material PLUS a
different, quiet procedural spatial bed. This avoids merely dressing a uniform
two-band noise loop with an isolated sound effect. Contrasting occupied rooms
use attenuated/equalized field material and ONE true sparse domestic event.
All artistic judgments remain HOLD until actual hearing and approved game QA.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RATE = 32000
SECONDS = 72
LENGTH = RATE * SECONDS
GUARD = round(0.15 * RATE)
CROSSFADE = round(2.25 * RATE)
OUT = ROOT / "tools/audio/.environment-regional-preview"


def command(args):
    return subprocess.run(args, check=True, capture_output=True)


def fetch(source, folder):
    url = source['url']
    if not (url.startswith("https://upload.wikimedia.org/wikipedia/commons/")
            or url.startswith("https://opengameart.org/sites/default/files/")):
        raise ValueError("Unapproved source hostname/path: " + source["id"])
    name = source["id"]
    dst = folder / (name + Path(url).suffix)
    digest = hashlib.sha1()
    size = 0
    req = urllib.request.Request(
        url, headers={"User-Agent": "SIBDLP-curated-environment-studio/0.2 (licensed audio audit)"})
    with urllib.request.urlopen(req, timeout=120) as response, dst.open("wb") as saved:
        while True:
            block = response.read(1024 * 1024)
            if not block:
                break
            size += len(block)
            if size > source["maxBytes"]:
                raise ValueError("Source exceeds independently reviewed budget: " + name)
            digest.update(block)
            saved.write(block)
    result = {'id': name, 'sha1': digest.hexdigest(), 'bytes': size,
              'license': source['license'], 'evidence': source['evidence'],
              'pinned': bool(source.get('sha1') and source.get('bytes'))}
    print("SOURCE", json.dumps(result), flush=True)
    if not source.get('sha1') or not source.get('bytes'):
        raise ValueError("Source provenance is not yet pinned: " + name)
    if result['sha1'] != source['sha1'] or size != source['bytes']:
        raise ValueError("Original file differs from pinned SHA-1/size: " + name)
    if size < 1000:
        raise ValueError("Unexpectedly short source")
    return dst


def decode(path):
    raw = command(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path),
                   '-vn', '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1']).stdout
    mono = np.frombuffer(raw, dtype='<f4').astype(np.float64)
    if not len(mono) or not np.isfinite(mono).all():
        raise ValueError("Unreadable physical audio: " + str(path))
    return mono


def rms(data):
    return float(np.sqrt(np.mean(np.square(data))))


def filter_periodic(data, lower, upper):
    # Gentle linked high/low pass; no high-Q resonances, pitch shifts or tone.
    freq = np.fft.rfftfreq(len(data), 1 / RATE)
    h = (freq ** 4 / (freq ** 4 + lower ** 4)) / (1 + (freq / upper) ** 4)
    return np.fft.irfft(np.fft.rfft(data) * h, n=len(data))


def source_segment(data, start):
    # Each 72s candidate receives a different contiguous real field interval.
    # The extra end overlap is smoothly faded onto the beginning. The same
    # original 24s audio NEVER repeats 3 times. No periodic granular stutter.
    pos = round(start * RATE)
    if len(data) < pos + LENGTH + CROSSFADE:
        raise ValueError("Field recording too short for selected complete arc")
    segment = data[pos:pos + LENGTH + CROSSFADE].copy()
    loop = segment[:LENGTH].copy()
    ramp = np.linspace(0, 1, CROSSFADE, endpoint=True)
    loop[:CROSSFADE] = segment[LENGTH:LENGTH + CROSSFADE] * (1 - ramp) + loop[:CROSSFADE] * ramp
    loop -= np.mean(loop)
    return loop


def actual_lufs(path):
    output = command(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'info',
                      '-i', str(path), '-af',
                      'loudnorm=I=-23:TP=-2:LRA=11:print_format=json',
                      '-f', 'null', '-']).stderr.decode('utf8', errors='replace')
    m = re.search(r'"input_i"\s*:\s*"([^"]+)"', output)
    if not m:
        raise ValueError('Not an EBU loudness measurement')
    return float(m.group(1))


def encode(data, target):
    guards = np.concatenate([data[-GUARD:], data, data[:GUARD]])
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
        wav_path = Path(temp.name)
    try:
        import wave
        with wave.open(str(wav_path), "wb") as writer:
            writer.setnchannels(1)
            writer.setsampwidth(2)
            writer.setframerate(RATE)
            writer.writeframes((np.clip(guards, -.93, .93) * 32767).astype('<i2').tobytes())
        command(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', str(wav_path),
                 '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '128k', str(target)])
    finally:
        wav_path.unlink(missing_ok=True)
    actual = decode(target)
    if len(actual) < GUARD + LENGTH:
        raise ValueError('Encoded preview invalid loop duration')
    return actual[GUARD:GUARD + LENGTH]


def spectral(data):
    f = np.fft.rfftfreq(len(data), 1 / RATE)
    e = np.abs(np.fft.rfft(data)) ** 2
    total = max(float(np.sum(e[1:])), 1e-12)
    return {'below250': float(np.sum(e[(f > 0) & (f < 250)]) / total),
            'mid250to2000': float(np.sum(e[(f >= 250) & (f < 2000)]) / total),
            'above2000': float(np.sum(e[f >= 2000]) / total)}


def correlation(a, b):
    x = a - np.mean(a)
    y = b - np.mean(b)
    return float(np.dot(x, y) / max(np.linalg.norm(x) * np.linalg.norm(y), 1e-12))


def main():
    book = json.loads((ROOT / "tools/audio/environment-regional-studies.json").read_text())
    registry = json.loads((ROOT / "assets/audio/manifest.json").read_text())
    source_book = json.loads((ROOT / "tools/audio/environment-book.json").read_text())
    spec = importlib.util.spec_from_file_location(
        "regional_procedural_bed", ROOT / "tools/audio/render-environment.py")
    procedural = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(procedural)
    sources = {}
    provenance = []
    OUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="sibdlp-regional-audio-") as temporary:
        folder = Path(temporary)
        for item in book["sources"]:
            original_path = fetch(item, folder)
            sources[item["id"]] = decode(original_path)
            provenance.append({'id': item['id'], 'url': item['url'],
                               'sha1': item['sha1'], 'bytes': item['bytes'],
                               'license': item['license']})
        reports = []
        rendered = {}
        for cue in book["studies"]:
            identifier = cue["id"]
            registered = registry["assets"][cue["referenceBed"]]
            previous = ROOT / registered['src'].removeprefix('./')
            actual_sha = hashlib.sha256(previous.read_bytes()).hexdigest()
            if actual_sha != registered['sha256']:
                raise ValueError('Game parent asset changed without catalog update')
            reference = decode(previous)
            start = round(registered['loop']['start'] * RATE)
            reference = reference[start:start + RATE * 24]
            if len(reference) != RATE * 24:
                raise ValueError('Invalid original 24s reference')
            periodic = next(c for c in source_book['cues']
                            if c['id'] == cue['referenceBed'])
            background = procedural.render(periodic, SECONDS)
            field = source_segment(sources[cue["mainSource"]], cue["fieldExcerptStart"])
            field = filter_periodic(field, cue["highpassHz"], cue["lowpassHz"])
            background = filter_periodic(background,
                                         max(85, cue["highpassHz"] * .75),
                                         cue["lowpassHz"])
            # RMS-normalized at the mixing stage, not a reckless loudness-boost
            # after encoding. Source contribution is measurable and comparable.
            field = field / max(rms(field), 1e-10) * cue["fieldGain"] * 0.034
            background = background / max(rms(background), 1e-10) * cue["windGain"] * 0.034
            raw = field + background
            real_fraction = float(np.sum(field ** 2) / max(
                np.sum(field ** 2) + np.sum(background ** 2), 1e-10))
            event_stats = []
            for e in cue["events"]:
                clip = sources[e["source"]]
                clip = filter_periodic(clip, 180, e["lowpassHz"])
                clip = clip / max(float(np.max(np.abs(clip))), 1e-10) * e["peak"]
                ramp_n = min(round(.032 * RATE), len(clip) // 4)
                curve = np.linspace(0, 1, ramp_n)
                clip[:ramp_n] *= curve
                clip[-ramp_n:] *= curve[::-1]
                at = round(e["at"] * RATE)
                if at < RATE or at + len(clip) >= LENGTH - RATE:
                    raise ValueError('Event would create loop boundary artifact')
                baseline_window = rms(raw[at:at + len(clip)])
                event_stats.append({'source':e['source'], 'atSeconds':e['at'],
                                    'eventVsBedDb':round(20 * math.log10(
                                        max(rms(clip), 1e-12) / max(baseline_window, 1e-12)),2)})
                raw[at:at + len(clip)] += clip
            # Keep the authored layer in a controlled relative loudness window:
            # no gain spike and no unadvertised environmental bus/global boost.
            if cue["events"]:
                parent_name = 'env-highland-wind' if cue["region"] == "highlands" else 'env-frontier-air'
                parent = registry["assets"][parent_name]
                parent_file = ROOT / parent['src'].removeprefix('./')
                parent_pcm = decode(parent_file)
                parent_pcm = parent_pcm[round(parent['loop']['start']*RATE):round(parent['loop']['start']*RATE) + 24*RATE]
                target = rms(parent_pcm) * 0.72
            else:
                target = rms(reference) * 0.91
            gain = target / max(rms(raw), 1e-10)
            if gain > 4 or gain < .15:
                raise ValueError('Unexpected candidate scale needed: '+identifier)
            raw *= gain
            if np.max(np.abs(raw)) > .8:
                raise ValueError('Unacceptably high instantaneous source peak')
            target_file = OUT / (identifier + '.mp3')
            decoded = encode(raw, target_file)
            thirds = [decoded[i*RATE*24:(i+1)*RATE*24] for i in range(3)]
            block_correlations = [correlation(thirds[a],thirds[b])
                                  for a,b in ((0,1),(0,2),(1,2))]
            if any(abs(v) > .9 for v in block_correlations):
                raise ValueError('Audibly suspect repeated 24s field blocks')
            if not np.isfinite(decoded).all() or np.max(np.abs(decoded)) >= .95:
                raise ValueError('Decoded preview clipping or invalid audio')
            edge = float(abs(decoded[0] - decoded[-1]))
            report = {'id':identifier, 'zone':cue["zone"],
                      'previewSha256':hashlib.sha256(target_file.read_bytes()).hexdigest(),
                      'bytes':target_file.stat().st_size, 'decodedSeconds':72.0,
                      'codec':'mp3 mono 32kHz 128kbps', 'sourceCatalogParent':cue['referenceBed'],
                      'sourceCatalogSha256':actual_sha, 'sourceLUFS':actual_lufs(previous),
                      'candidateLUFS':actual_lufs(target_file),
                      'fieldSource':cue["mainSource"],
                      'recordedFieldEnergyFractionPreCrossTerms':real_fraction,
                      'recordedFieldRmsBeforeMixGain':rms(field),
                      'loopEdgeDelta':edge, 'trueDecodedPeak':float(np.max(np.abs(decoded))),
                      'spectral':spectral(decoded),
                      'correlations24s':block_correlations,
                      'sparsePhysicalEvents':event_stats,
                      'catalogRegistered':False, 'genuinelyHeard':False,
                      'artisticApproval':'HOLD'}
            reports.append(report)
            rendered[identifier] = decoded
            print('CANDIDATE',json.dumps(report),flush=True)
        contrast = []
        for a in range(len(reports)):
            for b in range(a+1,len(reports)):
                left=reports[a]['id']
                right=reports[b]['id']
                contrast.append({'a':left,'b':right,
                                 'timeDomainCorrelation':correlation(
                                     rendered[left],rendered[right])})
        if len(reports) != 4:
            raise ValueError('Regional quality scope requires exactly 4 contrasting rooms')
        if sum(x['recordedFieldEnergyFractionPreCrossTerms'] < .2 for x in reports[:2]):
            raise ValueError('Outdoor candidates not primarily recorded physical field source')
        result={'productionShaSource':'read from Actions run', 'sources':provenance,
                'candidates':reports,'sceneCrossContrasts':contrast,
                'boundary':'NO game registration; NO merge or Pages; no hearing/physical-speaker approval',
                'encodedTotalBytes':sum(x['bytes'] for x in reports),
                'decodedTotalBytesIfAllFourCached':4*LENGTH*4}
        (OUT / 'regional-studio-measurements.json').write_text(json.dumps(result,indent=2)+'\n')
        print('PASS: four 72s distinct source-verified encoded candidate files; artistic HOLD',flush=True)


if __name__ == '__main__':
    main()
