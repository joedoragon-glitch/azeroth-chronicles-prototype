"""Original restrained ambience, rendered without samples or audio-generation models.

Reproduce: python3 tools/audio/render-environment.py [--id env-woodland-day]
Python/numpy and ffmpeg/libmp3lame are development dependencies only.
Periodic spectral textures and wrapped transients keep the authored loop continuous.
Custom imported replacements, routing and edited creative guides are preserved.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import tempfile
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
RATE = 32000
OWNER = 'environment-book'


def render(cue, seconds):
    rng = np.random.default_rng(cue['seed'])
    length = round(seconds * RATE)
    t = np.arange(length) / RATE
    frequencies = np.fft.rfftfreq(length, 1 / RATE)

    def texture(low, high):
        spectrum = np.fft.rfft(rng.normal(0, 1, length))
        # Smooth slopes, no sharp band edges, DC or inaudible low-end buildup.
        shape = np.exp(-(frequencies / high) ** 4) * (1 - np.exp(-(frequencies / low) ** 4))
        result = np.fft.irfft(spectrum * shape, n=length)
        return result / max(np.sqrt(np.mean(result ** 2)), 1e-9)

    mix = np.zeros(length)
    for layer in cue['layers']:
        phase = rng.uniform(0, 2 * np.pi)
        envelope = .64 + .2 * np.sin(2 * np.pi * t / seconds + phase) + .12 * np.sin(6 * np.pi * t / seconds + phase * .4)
        mix += texture(layer['low'], layer['high']) * layer['level'] * envelope

    def add(at, samples):
        # Circular placement preserves tails across the loop point.
        start = round(at * RATE) % length
        first = min(len(samples), length - start)
        mix[start:start + first] += samples[:first]
        if len(samples) > first:
            mix[:len(samples) - first] += samples[first:]

    for event in cue.get('details', []):
        for at in event['times']:
            duration = event.get('duration', .8)
            u = np.arange(round(duration * RATE)) / RATE
            attack = np.minimum(u / .04, 1)
            tail = np.maximum(1 - u / duration, 0) ** 2
            if event['type'] == 'water':
                frequency = event['frequency'] * (1 - .18 * u / duration)
                phase = 2 * np.pi * np.cumsum(frequency) / RATE
                out = np.sin(phase) * np.exp(-u / .06) + .16 * np.sin(phase * 1.72) * np.exp(-u / .12)
                out *= np.minimum(u / .003, 1) * tail
            elif event['type'] == 'wood':
                phase = 2 * np.pi * np.cumsum(event['frequency'] * (1 + .12 * np.sin(2 * np.pi * 2.3 * u))) / RATE
                out = (np.sin(phase) + .2 * np.sin(phase * 2.07)) * attack * tail
            else:  # Distant irregular work vibrations, without a musical pulse.
                frequency = event['frequency']
                out = (np.sin(2 * np.pi * frequency * u) + .22 * np.sin(2 * np.pi * frequency * 2.37 * u)) * attack * tail
            add(at, out * event['level'])
    mix -= np.mean(mix)
    return mix


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--id')
    args = parser.parse_args()
    book = json.loads((ROOT / 'tools/audio/environment-book.json').read_text())
    path = ROOT / 'assets/audio/manifest.json'
    registry = json.loads(path.read_text())
    assets = registry['assets']
    selected = [c for c in book['cues'] if not args.id or c['id'] == args.id]
    if not selected:
        raise ValueError('Unknown environmental cue')
    for cue in selected:
        previous = assets.get(cue['id'], {})
        if previous and previous.get('managedBy') != OWNER:
            print('Preserving custom replacement:', cue['id'])
            continue
        samples = render(cue, book['seconds'])
        # Codec guards contain the same periodic texture rather than silence.
        guard = round(.15 * RATE)
        samples = np.concatenate([samples[-guard:], samples, samples[:guard]])
        destination = ROOT / ('assets/audio/ambience/' + cue['id'] + '.mp3')
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as temp:
            wav = Path(temp) / 'bed.wav'
            with wave.open(str(wav), 'wb') as out:
                out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE)
                out.writeframes((np.clip(samples, -.9, .9) * 32767).astype('<i2').tobytes())
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '96k', str(destination)], check=True)
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(destination)]))
        assets[cue['id']] = {**previous, 'kind': 'ambience', 'src': './' + destination.relative_to(ROOT).as_posix(), 'duration': duration, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'loop': {'start': .15, 'end': book['seconds'] + .15}, 'credits': {'author': 'Azeroth Chronicles original procedural sound design', 'license': 'CC0-1.0'}, 'title': cue['title'], 'managedBy': OWNER, 'generationGuide': previous.get('generationGuide') or cue['guide']}
        print(cue['id'], 'RMS', round(float(np.sqrt(np.mean(samples ** 2))), 4), 'peak', round(float(np.max(np.abs(samples))), 4))
    # Runtime routing is authored in the manifest and never reset by regeneration.
    registry.setdefault('creativeSource', {})['environment'] = {'method': 'Original procedural spectral textures and physical-style transients; no imported recordings or audio-generation model', 'recipe': 'tools/audio/environment-book.json', 'renderer': 'tools/audio/render-environment.py'}
    path.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
