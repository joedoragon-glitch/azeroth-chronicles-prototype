#!/usr/bin/env python3
"""SIBDLP independent source-render SFX quality gates; never an ear test."""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path
import numpy as np

ROOT = Path(sys.argv[1] if len(sys.argv)>1 else 'tools/audio/sfx-pilot-previews')
assert ROOT.is_dir(), f'Missing pilot renders at {ROOT}'
manifest = json.loads((ROOT / 'pilot-manifest.json').read_text())
assert 'UNHEARD' in manifest['status'] and 'NOT LIVE GAME AUDIO' in manifest['status']
assert len(manifest['cues']) == 10
assert {x['id'] for x in manifest['cues']} == {
  'paladin-sword-swing','paladin-sword-impact','ranger-arrow-release','ranger-arrow-impact',
  'mage-arcane-release','mage-arcane-impact','rogue-bell-basic','rogue-bell-performance',
  'enemy-claw-contact','critical-warning-study'}
assert not str(ROOT).replace('\\','/').startswith('assets/audio'), 'Do not render into live asset folder'

def spectral_share(x, rate, lo, hi):
    fft=np.abs(np.fft.rfft(x*np.hanning(len(x))))**2
    f=np.fft.rfftfreq(len(x),1/rate)
    return float(fft[(f>=lo)&(f<hi)].sum()/max(1e-10,fft.sum()))

rows={}
for entry in manifest['cues']:
    file=ROOT/(entry['id']+'.wav')
    assert file.name==entry['file'] and file.is_file()
    with wave.open(str(file)) as w:
        assert (w.getnchannels(),w.getframerate(),w.getsampwidth())==(1,48000,2),file
        data=w.readframes(w.getnframes())
        x=np.frombuffer(data,dtype='<i2').astype('float64')/32768
        assert abs(len(x)/48000-entry['duration'])<.001
    assert 0.18<len(x)/48000<.60, file
    assert np.isfinite(x).all() and not np.all(x==0)
    assert x[0]==0 and x[-1]==0, f'Click-prone boundary: {file}'
    peak=float(np.max(np.abs(x)))
    rms=float(np.sqrt(np.mean(x*x)))
    assert .06<=peak<=.40 and .008<=rms<=.07, (file,peak,rms)
    rows[entry['id']]={'peak':round(peak,4),'rms':round(rms,4),
                       'low_under_350':round(spectral_share(x,48000,0,350),4),
                       'mid_1000_6000':round(spectral_share(x,48000,1000,6000),4),
                       'duration':round(len(x)/48000,3),
                       'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}

# Concrete regressions caught by the first source-quality review.
assert rows['ranger-arrow-impact']['low_under_350']<.10, 'Arrow impact lost on small speakers'
assert rows['critical-warning-study']['mid_1000_6000']>.45, 'No midrange warning presence'
assert rows['rogue-bell-basic']['duration']<.32, 'Handbell-length basic jingle regression'
assert rows['rogue-bell-performance']['duration']<.60, 'Overlapping too-long rhythm regression'
assert rows['paladin-sword-swing']['rms'] < rows['paladin-sword-impact']['rms']*1.8, 'Swing dominates steel contact'
assert rows['paladin-sword-impact']['duration']<=.31, 'Prolonged steel ring regression'

# These measurements do not prove correct gameplay staging, speaker translation,
# perceptual material realism, mix dynamics, repeat fatigue or artistic acceptance.
if len(sys.argv)>2 and sys.argv[2]=='--verify-rebuild':
    script=Path(__file__).resolve().parents[1]/'tools/audio/sfx-pilot-studio.py'
    with tempfile.TemporaryDirectory() as td:
        env={**os.environ,'PYTHONHASHSEED':'991'}
        subprocess.run([sys.executable,str(script),td],check=True,stdout=subprocess.PIPE,env=env)
        for entry in manifest['cues']:
            name=entry['id']+'.wav'
            assert (ROOT/name).read_bytes()==(Path(td)/name).read_bytes(),f'Non-deterministic: {name}'

print(json.dumps({'status':'SOURCE AND RENDER CHECK ONLY; HEARD QUALITY UNVERIFIED',
                  'cues':rows},indent=2))
