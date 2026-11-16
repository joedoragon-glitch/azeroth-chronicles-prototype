#!/usr/bin/env python3
"""Physical SFX QA for the 30 existing registered cues, not a listening verdict."""
import hashlib, json, wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'assets/audio/manifest.json').read_text())
rollback=json.loads((ROOT/'tools/audio/sfx-phase1-rollback.json').read_text())
metrics=json.loads((ROOT/'tools/audio/sfx-phase1-metrics.json').read_text())
all_ids=set(rollback['originalEntries'])
assert len(all_ids)==30==metrics['retainedIds']
assert set(metrics['cues'])==all_ids
assert set(rollback['originalSha256'])==all_ids
assert set(k for k,v in manifest['assets'].items() if v['kind']=='effect')==all_ids
assert len([v for v in manifest['assets'].values() if v['kind']=='music'])==84
assert len([v for v in manifest['assets'].values() if v['kind']=='ambience'])==34

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def frac(x,rate,lo,hi):
    freqs=np.fft.rfftfreq(len(x),1/rate);amps=np.abs(np.fft.rfft(x*np.hanning(len(x))))**2
    return float(amps[(freqs>=lo)&(freqs<hi)].sum()/max(1e-9,amps.sum()))
details={}
for key in sorted(all_ids):
    orig=ROOT/'tools/audio/sfx-legacy/dev288'/f'{key}.wav'
    new=ROOT/'assets/audio/effects'/f'{key}.wav'
    assert orig.is_file() and new.is_file()
    assert sha(orig)==rollback['originalSha256'][key],f'Frozen reference changed: {key}'
    assert sha(orig)==rollback['originalEntries'][key]['sha256'],key
    assert sha(new)==manifest['assets'][key]['sha256']==metrics['cues'][key]['sha256'],key
    assert sha(new)!=sha(orig),f'Not actually replaced: {key}'
    entry=manifest['assets'][key]
    assert entry['managedBy']=='sfx-phase1-original-hybrid'
    assert entry['recipe']['source']=='tools/audio/sfx-phase1-master.py'
    assert 'Azeroth Chronicles' not in entry['credits']['author']
    assert entry['credits']['license'].startswith('Original project-owned')
    with wave.open(str(new)) as w:
        assert (w.getnchannels(),w.getframerate(),w.getsampwidth())==(1,48000,2),key
        duration=w.getnframes()/w.getframerate()
        x=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
    assert .24<=duration<=.38,(key,duration)
    assert abs(duration-entry['duration'])<.00005,key
    assert np.isfinite(x).all() and x[0]==0 and x[-1]==0,key
    peak=float(abs(x).max());rms=float(np.sqrt(np.mean(x*x)))
    assert .025<peak<=.402 and .007<rms<.086,(key,peak,rms)
    low=frac(x,48000,0,350);mid=frac(x,48000,1000,6000)
    details[key]={'peak':round(peak,5),'rms':round(rms,5),
      'lowUnder350':round(low,4),'mid1to6k':round(mid,4),
      'duration':round(duration,3)}
assert details['sfx-arrow-impact']['lowUnder350']<.10, 'Arrow target contact masked on small speakers'
assert details['sfx-critical-warning']['mid1to6k']>.30, 'Danger warning lacks midrange'
assert details['sfx-hero-steel-swing']['duration']<details['sfx-hero-steel-impact']['duration']
assert details['sfx-piercing-volley']['duration']>.34
# Protect semantic topology, not just physical bytes.
from collections import Counter
c=Counter((s.split('-')[-1] if s not in ['sfx-critical-warning','sfx-hero-steel-swing',
'sfx-hero-steel-impact','sfx-power-strike','sfx-holy-cleave','sfx-piercing-volley'] else 'special') for s in all_ids)
assert c=={'release':12,'impact':12,'special':6},c
# A 30-sound count does not replace all 95 event categories; deliberate live/procedural
# fallbacks remain. Rebinding or adding events is intentionally Phase 2, not this pass.
assert len(manifest['director']['events'])==95
assert len([a for a in manifest['director']['events'].values() if a])==8
print(json.dumps({'status':'PASS: 30 original recordings archived, replaced and hashed; '
 'source/render technical gates only, no by-ear or device acceptance',
 'recordedEffects':30,'olderSourceProtected':30,'signalData':details},indent=2))
