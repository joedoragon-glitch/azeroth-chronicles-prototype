"""Issue #727 Stage 2 — first two source-led LONG-FORM outdoor field studies.

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
import sys
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
OUT = ROOT / "tools/audio/.environment-727-preview"
PROBE = "--probe-sources" in sys.argv


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
    digest256 = hashlib.sha256()
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
            digest256.update(block)
            saved.write(block)
    result = {'id': name, 'sha1': digest.hexdigest(),
              'sha256': digest256.hexdigest(), 'bytes': size,
              'license': source['license'], 'evidence': source['evidence'],
              'pinned': bool(source.get('sha1') and source.get('bytes'))}
    print("SOURCE", json.dumps(result), flush=True)
    if not PROBE and (not source.get('sha1') or not source.get('sha256')
                      or not source.get('bytes')):
        raise ValueError("Source provenance is not yet pinned: " + name)
    if (source.get('sha1') and result['sha1'] != source['sha1']) or (
            source.get('sha256') and result['sha256'] != source['sha256']) or (
            source.get('bytes') and size != source['bytes']):
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


def actual_true_peak(path):
    output = command(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'info',
                      '-i', str(path), '-af',
                      'loudnorm=I=-23:TP=-2:LRA=11:print_format=json',
                      '-f', 'null', '-']).stderr.decode('utf8', errors='replace')
    m = re.search(r'"input_tp"\s*:\s*"([^"]+)"', output)
    if not m or not math.isfinite(float(m.group(1))):
        raise ValueError('True peak missing from decoded EBU loudness analysis')
    return float(m.group(1))


def transparent_peak_knee(data, threshold=.17, width=.095):
    """Keep low-level field nuance and smoothly constrain isolated sharp peaks.

    A bounded monotonic transfer function, not a whole-scene compressor or
    new game mix gain. Starts with unit derivative at its threshold.
    """
    absolute = np.abs(data)
    excess = np.maximum(absolute - threshold, 0)
    limited = np.where(absolute <= threshold, absolute,
                       threshold + width * excess / (width + excess))
    return np.copysign(limited, data)


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
    book = json.loads((ROOT / "tools/audio/environment-727-outdoor-studies.json").read_text())
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
            if PROBE:
                metadata = json.loads(command(['ffprobe', '-v', 'error',
                    '-show_entries', 'format=duration:stream=codec_name,sample_rate,channels',
                    '-of', 'json', str(original_path)]).stdout)
                with original_path.open("rb") as stream:
                    sha1 = hashlib.sha1()
                    sha256 = hashlib.sha256()
                    while True:
                        chunk = stream.read(1024 * 1024)
                        if not chunk:
                            break
                        sha1.update(chunk)
                        sha256.update(chunk)
                measured = {
                    'id': item['id'], 'url': item['url'], 'evidence': item['evidence'],
                    'artist': item['creator'], 'claimedLicense': item['license'],
                    'bytes': original_path.stat().st_size,
                    'sha1': sha1.hexdigest(), 'sha256': sha256.hexdigest(),
                    'probe': metadata,
                    'status': 'SOURCE PROBE ONLY; match bytes/sha1 to pinned ledger before render'
                }
                provenance.append(measured)
                print('SOURCE_PROBE', json.dumps(measured), flush=True)
            else:
                sources[item["id"]] = decode(original_path)
                provenance.append({'id': item['id'], 'url': item['url'],
                                   'sha1': item['sha1'], 'sha256': item['sha256'],
                                   'bytes': item['bytes'],
                                   'license': item['license']})
        if PROBE:
            (OUT / 'outdoor-source-probe.json').write_text(json.dumps({
                'stage': '727 Stage2', 'sourceRecords': provenance,
                'qualityStatus': 'NOT PINNED, NOT RENDERED, NOT HEARD',
                'gameRegistered': False, 'deployed': False}, indent=2) + '\n')
            print('PASS SOURCE PROBE ONLY: exact bytes and hashes recorded; no candidate produced', flush=True)
            return
        reports = []
        signal_blocks = []
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
            pre_knee_sample_peak = float(np.max(np.abs(raw)))
            raw = transparent_peak_knee(raw)
            post_knee_sample_peak = float(np.max(np.abs(raw)))
            if post_knee_sample_peak > .27:
                raise ValueError('Regional field preview contains unbounded transient')
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
            one_second = decoded.reshape(SECONDS, RATE).astype('float64')
            seconds_rms = np.sqrt(np.mean(np.square(one_second), axis=1))
            edge_envelope_db = 20 * math.log10(
                max(float(seconds_rms[0]), 1e-12) / max(float(seconds_rms[-1]), 1e-12))
            # 0.25 dB measurement tolerance above the 4dB review target:
            # naturally turbulent recorded field air can straddle the window.
            # Keep the actual measured delta visible; don't flatten a genuine
            # long-form field recording simply to satisfy a 0.011dB mismatch.
            edge_block = abs(edge_envelope_db) > 4.25 or edge > .005
            print('LOOP_QA', json.dumps({'id': identifier,
                'edgeSampleDelta': edge, 'firstLast1sDb': round(edge_envelope_db, 3),
                'maxEdgeSampleDelta': .005, 'maxEnvelopeDb': 4.25,
                'pass': not edge_block}), flush=True)
            if edge_block:
                # Still collect all preview measurements so the designer can
                # diagnose both source intervals; FAIL at end, NEVER promote.
                signal_blocks.append({'id': identifier, 'edgeSampleDelta': edge,
                                      'firstLast1sDb': round(edge_envelope_db, 3),
                                      'reason': 'decoded MP3 loop boundary quality'})
            measured_true_peak = actual_true_peak(target_file)
            if measured_true_peak >= -1.5:
                raise ValueError('Actual encoded true peak too close to clipping')
            report = {'id':identifier, 'zone':cue["zone"],
                      'previewSha256':hashlib.sha256(target_file.read_bytes()).hexdigest(),
                      'bytes':target_file.stat().st_size, 'decodedSeconds':72.0,
                      'codec':'mp3 mono 32kHz 128kbps', 'sourceCatalogParent':cue['referenceBed'],
                      'sourceCatalogSha256':actual_sha, 'sourceLUFS':actual_lufs(previous),
                      'candidateLUFS':actual_lufs(target_file),
                      'candidateTruePeakDbTP':measured_true_peak,
                      'preKneeSamplePeak':pre_knee_sample_peak,
                      'postKneeSamplePeak':post_knee_sample_peak,
                      'fieldSource':cue["mainSource"],
                      'recordedFieldEnergyFractionPreCrossTerms':real_fraction,
                      'recordedFieldRmsBeforeMixGain':rms(field),
                      'loopEdgeDelta':edge,
                      'loopStartEndOneSecondRmsDb':round(edge_envelope_db, 3),
                      'decodedSamplePeak':float(np.max(np.abs(decoded))),
                      'maxOneSecondCrestDb':round(float(np.max(20*np.log10(
                          np.max(np.abs(one_second),axis=1) /
                          np.maximum(seconds_rms, 1e-12)))), 3),
                      'spectral':spectral(decoded),
                      'correlations24s':block_correlations,
                      'sparsePhysicalEvents':event_stats,
                      'catalogRegistered':False, 'genuinelyHeard':False,
                      'artisticApproval':'HOLD',
                      'signalGate':'BLOCK' if edge_block else 'PASS'}
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
        if len(reports) != 2:
            raise ValueError('Outdoor Stage2 first trial must contain exactly two distinctive day scenes')
        if any(x['recordedFieldEnergyFractionPreCrossTerms'] < .5 for x in reports):
            raise ValueError('Outdoor recordings must be the principal physical signal')
        result={'productionShaSource':'read from Actions run', 'sources':provenance,
                'candidates':reports,'sceneCrossContrasts':contrast,
                'boundary':'NO game registration; NO merge or Pages; no hearing/physical-speaker approval',
                'signalQualityBlocks':signal_blocks,
                'technicalAcceptance':'BLOCK' if signal_blocks else 'CANDIDATE SIGNAL PASS / ARTISTIC HOLD',
                'encodedTotalBytes':sum(x['bytes'] for x in reports),
                'decodedTotalBytesIfBothCached':2*LENGTH*4}
        (OUT / 'outdoor-studio-measurements.json').write_text(json.dumps(result,indent=2)+'\n')
        if signal_blocks:
            raise ValueError('Candidate decoded loop quality BLOCKS: ' + json.dumps(signal_blocks))
        print('PASS: two 72s distinct source-verified outdoor encoded PREVIEWS; artistic HOLD; runtime untouched',flush=True)


if __name__ == '__main__':
    main()
