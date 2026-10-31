"""Issue #709: bounded, NO-REGISTER environmental source-quality studio.

Two contrasting interior proofs only. This tool downloads manually curated
PDSounds public-domain originals from Wikimedia's original-file host, verifies
the expected file identity (SHA-1 if pinned), and layers a very sparse recorded
physical detail onto an existing *real decoded* regional bed. Output is only
an isolated review MP3 + measurements; it never edits the game catalog, the
14 existing environmental masters, the score, or generated build assets.

Requires numpy, ffmpeg, ffprobe. No neural/audio model or web runtime required.
"""
import hashlib
import json
import math
import re
import subprocess
import tempfile
import urllib.request
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RATE = 32000
SECONDS = 24
GUARD = round(0.15 * RATE)
LENGTH = SECONDS * RATE


def run(args):
    return subprocess.run(args, check=True, capture_output=True)


def fetch(source, directory):
    url = source['originalUrl']
    if not url.startswith('https://upload.wikimedia.org/wikipedia/commons/'):
        raise ValueError('Unexpected unreviewed source host')
    request = urllib.request.Request(
        url, headers={'User-Agent': 'SIBDLP-AudioStudio/0.1 (game source provenance review)'})
    with urllib.request.urlopen(request, timeout=50) as response:
        blob = response.read(8 * 1024 * 1024 + 1)
    if len(blob) > 8 * 1024 * 1024 or len(blob) < 1000:
        raise ValueError('Invalid external source length')
    digest = hashlib.sha1(blob).hexdigest()
    if source['sha1'] and digest != source['sha1']:
        raise ValueError('Reviewed source SHA-1 changed: ' + source['key'])
    if source['bytes'] and len(blob) != source['bytes']:
        raise ValueError('Reviewed source byte length changed: ' + source['key'])
    path = directory / (source['key'] + '.ogg')
    path.write_bytes(blob)
    return path, {'id': source['key'], 'sha1': digest, 'size': len(blob),
                  'license': source['license'], 'approvedShaPinned': bool(source['sha1'])}


def decode(file):
    cmd = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-i', str(file),
           '-vn', '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1']
    data = np.frombuffer(run(cmd).stdout, dtype='<f4').astype(np.float64)
    if len(data) == 0 or not np.isfinite(data).all():
        raise ValueError('Undecodable/nonfinite source: ' + str(file))
    return data


def selective_color(samples, low, high):
    # Smooth periodic filters avoid a brittle one-filter-for-every-room preset.
    # No stereo widening, spectral band copy, pitch shifting or music.
    frequencies = np.fft.rfftfreq(len(samples), 1 / RATE)
    f4 = frequencies ** 4
    response = f4 / (f4 + low ** 4) / (1 + (frequencies / high) ** 4)
    return np.fft.irfft(np.fft.rfft(samples) * response, n=len(samples))


def seam_delta(samples):
    return float(abs(samples[0] - samples[-1]))


def source_lufs(file):
    cmd = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'info',
           '-i', str(file), '-af',
           'loudnorm=I=-23:TP=-2:LRA=11:print_format=json', '-f', 'null', '-']
    output = run(cmd).stderr.decode('utf8', errors='replace')
    match = re.search(r'"input_i"\\s*:\\s*"([^"]+)"', output)
    if not match or not math.isfinite(float(match.group(1))):
        raise ValueError('Integrated LUFS was not measured')
    return float(match.group(1))


def band_fractions(samples):
    # This is an actual-signal diagnostic, not a perceptual quality grade.
    f = np.fft.rfftfreq(len(samples), 1 / RATE)
    e = np.abs(np.fft.rfft(samples)) ** 2
    total = max(float(np.sum(e[1:])), 1e-12)
    return {'below250': float(np.sum(e[(f > 0) & (f < 250)]) / total),
            'above2000': float(np.sum(e[f >= 2000]) / total),
            'mid250to2000': float(np.sum(e[(f >= 250) & (f < 2000)]) / total)}


def write_mp3(samples, target):
    # Repeat the exact periodic tail/head, not inserted digital silence.
    guard = np.concatenate([samples[-GUARD:], samples, samples[:GUARD]])
    wav_path = target.with_suffix('.wav')
    with wave.open(str(wav_path), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes((np.clip(guard, -0.94, 0.94) * 32767).astype('<i2').tobytes())
    run(['ffmpeg', '-nostdin', '-y', '-v', 'error', '-i', str(wav_path),
         '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '128k', str(target)])
    wav_path.unlink()
    # Evaluate the actual MP3 decoded loop interval, never only pre-encode PCM.
    decoded = decode(target)
    if len(decoded) < GUARD + LENGTH:
        raise ValueError('Encoded preview is too short')
    loop = decoded[GUARD:GUARD + LENGTH]
    return loop


def main():
    palette = json.loads((ROOT / 'tools/audio/environment-curated-pilots.json').read_text())
    manifest = json.loads((ROOT / 'assets/audio/manifest.json').read_text())
    output = ROOT / 'tools/audio/.environment-studio-preview'
    output.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='sibdlp-env-studio-') as temporary:
        folder = Path(temporary)
        sources = {}
        provenance = []
        for item in palette['sources']:
            downloaded, record = fetch(item, folder)
            sources[item['key']] = decode(downloaded)
            provenance.append(record)
            print('PROVENANCE', json.dumps(record))
        reports = []
        for cue in palette['pilots']:
            asset = manifest['assets'][cue['baseBed']]
            if asset['kind'] != 'ambience':
                raise ValueError('Cannot use a non-environmental parent')
            root_file = ROOT / asset['src'].removeprefix('./')
            baseline_file_sha = hashlib.sha256(root_file.read_bytes()).hexdigest()
            if baseline_file_sha != asset['sha256']:
                raise ValueError('Existing encoded parent hash mismatch')
            original = decode(root_file)
            start = round(asset['loop']['start'] * RATE)
            base = original[start:start + LENGTH]
            if len(base) != LENGTH:
                raise ValueError('Invalid source loop bounds')
            tinted = selective_color(base, cue['highpassHz'], cue['lowpassHz'])
            candidate = tinted * cue['bedGain']
            clip = sources[cue['physicalDetail']]
            # No stretching, no rate manipulation, no repeated tonal one-shot.
            clip = selective_color(clip, 180, 4000)
            maximum = float(np.max(np.abs(clip)))
            if maximum < 1e-5:
                raise ValueError('Recorded physical source is silent')
            clip = clip / maximum * cue['eventPeak']
            # Symmetric edges avoid slicing the microphone transient abruptly.
            ramp_len = min(round(0.028 * RATE), len(clip) // 4)
            fade = np.linspace(0, 1, ramp_len)
            clip[:ramp_len] *= fade
            clip[-ramp_len:] *= fade[::-1]
            point = round(cue['eventAtSeconds'] * RATE)
            if point + len(clip) > LENGTH - RATE or point < RATE:
                raise ValueError('Event too close to loop seam')
            candidate[point:point + len(clip)] += clip
            if float(np.max(np.abs(candidate))) > .7:
                raise ValueError('Candidate has a surprising high peak')
            target = output / (cue['id'] + '.mp3')
            encoded_loop = write_mp3(candidate, target)
            source_loudness = source_lufs(root_file)
            rendered_loudness = source_lufs(target)
            report = {'id': cue['id'], 'place': cue['place'], 'baseId': cue['baseBed'],
                      'baseSourceSha256': baseline_file_sha,
                      'previewFile': target.name,
                      'previewSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                      'previewBytes': target.stat().st_size,
                      'sourceIntegratedLUFS': source_loudness,
                      'previewIntegratedLUFS': rendered_loudness,
                      'relativeLevelChangeDb': round(rendered_loudness - source_loudness, 3),
                      'loopBoundaryDeltaPcm': seam_delta(encoded_loop),
                      'decodedLoopSeconds': len(encoded_loop) / RATE,
                      'decodedPeak': float(np.max(np.abs(encoded_loop))),
                      'originalSpectralBands': band_fractions(base),
                      'candidateSpectralBands': band_fractions(encoded_loop),
                      'physicalSource': cue['physicalDetail'], 'routeGainUnchanged': cue['routeGain'],
                      'isolateOnly': True, 'heard': False, 'artAccepted': False}
            reports.append(report)
            print('PILOT', json.dumps(report))
        summary = {'realSourceProvenance': provenance, 'candidates': reports,
                   'boundary': 'NO catalog edits, NO music changes, not heard, NO artistic GO',
                   'pinnedSourceCount': sum(int(p['approvedShaPinned']) for p in provenance)}
        (output / 'environment-studio-results.json').write_text(
            json.dumps(summary, indent=2) + '\\n')
        if len(reports) != 2:
            raise ValueError('Expected exactly two independently authored room pilots')
        print('PASS two real-sample environmental studio previews: format and signal integrity only; heard sound HOLD')


if __name__ == '__main__':
    main()
