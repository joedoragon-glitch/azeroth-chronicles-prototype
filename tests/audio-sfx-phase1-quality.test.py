#!/usr/bin/env python3
"""Physical SFX QA for the 30 existing registered cues, not a listening verdict."""
import hashlib, json, wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'assets/audio/manifest.json').read_text())
rollback=json.loads((ROOT/'tools/audio/sfx-phase1-rollback.json').read_text())
metrics=json.loads((ROOT/'tools/audio/sfx-phase1-metrics.json').read_text())
old_levels=json.loads((ROOT/'tools/audio/sfx-measurements.json').read_text())
all_ids=set(rollback['originalEntries'])
assert len(all_ids)==30==metrics['retainedIds']
assert set(metrics['cues'])==all_ids
assert set(rollback['originalSha256'])==all_ids
assert set(rollback['originalEventBindings'])==all_ids
assert sum(len(x) for x in rollback['originalEventBindings'].values())==34
expected_calibration={
 'sfx-steel-release':.29,'sfx-spectral-release':.50,
 'sfx-arcane-release':.54,'sfx-dust-release':.36,
 'sfx-claw-release':.20,'sfx-stone-release':.24,'sfx-holy-release':.53}
for key in all_ids:
    receipts=rollback['originalEventBindings'][key]
    assert receipts and all(x['binding']['asset']==key for x in receipts)
    for receipt in receipts:
        current=manifest['director']['events'][receipt['event']][receipt['index']]
        assert current['asset']==key
        original=receipt['binding']
        if key in expected_calibration:
            assert abs(current['gain']-expected_calibration[key])<1e-9
            assert current=={**original,'gain':expected_calibration[key]},(key,'unexpected event change')
        else:
            assert current==original,(key,'unrelated event contract changed')
phase2_ids={'sfx-phase2-rogue-bell-basic','sfx-phase2-rogue-bell-emphatic',
 'sfx-phase2-lifebinder-cold-ring','sfx-phase2-quest-complete',
 'sfx-phase2-charmed-wraith-heritage','sfx-phase2-barracks-complete'}
assert set(k for k,v in manifest['assets'].items() if v['kind']=='effect') == all_ids | phase2_ids
assert len([v for v in manifest['assets'].values() if v['kind']=='music'])==84
assert len([v for v in manifest['assets'].values() if v['kind']=='ambience'])==34

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def frac(x,rate,lo,hi):
    freqs=np.fft.rfftfreq(len(x),1/rate);amps=np.abs(np.fft.rfft(x*np.hanning(len(x))))**2
    return float(amps[(freqs>=lo)&(freqs<hi)].sum()/max(1e-9,amps.sum()))
details={}
stage_signals={}
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
    stage_signals[key]=x
    peak=float(abs(x).max());rms=float(np.sqrt(np.mean(x*x)))
    assert .025<peak<=.402 and .007<rms<.086,(key,peak,rms)
    # The v1 render raised hero sword swing RMS 3.92x and danger warning 1.77x.
    # New material identities must not silently remaster the entire game's SFX
    # loudness or override the existing bus, duck and priority decisions.
    original_rms=float(old_levels[key]['rms'])
    ratio=rms/original_rms
    assert 0.80<=ratio<=1.14,(key,'unexpected original-relative loudness shift',ratio)
    assert abs(metrics['cues'][key]['referenceRms']-original_rms)<.000002,key
    assert abs(metrics['cues'][key]['rmsRatio']-ratio)<.002,key
    low=frac(x,48000,0,350);mid=frac(x,48000,1000,6000)
    details[key]={'peak':round(peak,5),'rms':round(rms,5),
      'lowUnder350':round(low,4),'mid1to6k':round(mid,4),
      'duration':round(duration,3),'rmsRatioToOriginal':round(ratio,4)}
# Source/render stage contrast gate: a launch must not inherit the same
# front-loaded transient as a landed contact. This catches accidental file
# aliasing and close amplitude-envelope staging, but is NOT proof that
# two cues sound distinct on headphones or phone speakers.
stage_contrast={}
for material in ('steel','claw','bone','stone','wet','arrow','spectral',
                 'ash','holy','arcane','root','dust'):
    launch=stage_signals[f'sfx-{material}-release']
    contact=stage_signals[f'sfx-{material}-impact']
    def first40(x):
        power=np.square(x)
        return float(power[:int(.040*48000)].sum()/max(1e-12,power.sum()))
    def center_ms(x):
        power=np.square(x)
        return float((power*np.arange(len(power))).sum()/max(1e-12,power.sum())/48)
    release_early,impact_early=first40(launch),first40(contact)
    release_center,impact_center=center_ms(launch),center_ms(contact)
    assert impact_early-release_early>.20,(material,'release and impact onset too alike',
                                            release_early,impact_early)
    assert release_center-impact_center>14,(material,'release lacks stage movement',
                                            release_center,impact_center)
    stage_contrast[material]={'releaseFirst40':round(release_early,3),
        'impactFirst40':round(impact_early,3),
        'releaseCenterMs':round(release_center,1),
        'impactCenterMs':round(impact_center,1)}
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
assert len(manifest['director']['events'])==99  # Existing 95 + 4 valid Phase 2 keys
assert len([a for a in manifest['director']['events'].values() if a])==8
print(json.dumps({'status':'PASS: 30 original recordings archived, replaced and hashed; '
 'source/render technical gates only, no by-ear or device acceptance',
 'recordedEffects':30,'olderSourceProtected':30,
 'stageContrast':stage_contrast,'signalData':details},indent=2))
