#!/usr/bin/env python3
"""Mutation tests; metric/source correctness is NOT acoustic listening."""
import copy,importlib.util,json,hashlib,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,root/path)
 m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
guard=load('controls','tools/audio/score-quality-controls.py')
boss=load('phase5','tools/audio/phase5-compose.py')
data=json.loads((root/'tools/audio/phase5-scores.json').read_text())
def reject(fn,phrase):
 try:fn()
 except (guard.QualityGateError,AssertionError) as e:
  assert phrase in str(e),str(e)
  return
 raise AssertionError('Negative regression accepted: '+phrase)
f=data['families'][0]
original=[[float(i),f['root']+12+n,1.55 if f['originalHook'][(i+1)%16] is None else .84] for i,n in enumerate(f['originalHook']) if n is not None]
played=[v for v in boss.note_events(f,'base') if v[0]<16]
assert guard.verify_heritage(original,played,cue=f['id'])['exact']
bad=copy.deepcopy(played);bad[0][1]+=12
reject(lambda:guard.verify_heritage(original,bad,cue=f['id']),'claimed-retained motif changed')
bad=copy.deepcopy(played);bad[0][0]+=.25
reject(lambda:guard.verify_heritage(original,bad,cue=f['id']),'claimed-retained motif changed')
crypt=data['families'][1]
a=[[float(i),crypt['root']+12+n,1.55 if crypt['originalHook'][(i+1)%16] is None else .84] for i,n in enumerate(crypt['originalHook']) if n is not None]
b=[v for v in boss.note_events(crypt,'base') if v[0]<16]
assert all(x[1]-y[1]==12 for x,y in zip(a,b))
reject(lambda:guard.verify_heritage(a,b,cue='boss-crypt',disposition='transformed',reason=''),'intentional theme changes')
assert not guard.verify_heritage(a,b,cue='boss-crypt',disposition='transformed',reason=crypt['motifRationale'])['exact']
for f in data['families']:
 assert not guard.guard_unexplained_full_layer_copy(boss.note_events(f,'base'),boss.note_events(f,'true'),cue=f['trueId'])['completeCopy']
reject(lambda:guard.guard_unexplained_full_layer_copy(boss.note_events(f,'base'),copy.deepcopy(boss.note_events(f,'base')),cue=f['trueId']),'complete simultaneous')
contexts=[{'id':f['id'],'performedRhythm':[[round(x[0],3),round(x[2],3)] for x in boss.note_events(f,'base')],'form':f['identity'],'energy':f['energy'],'harmony':f['harmony']} for f in data['families']]
assert guard.guard_not_cloned_contexts(contexts)==8
bad=copy.deepcopy(contexts)
for k in ('performedRhythm','form','energy','harmony'):bad[1][k]=copy.deepcopy(bad[0][k])
reject(lambda:guard.guard_not_cloned_contexts(bad),'clones complete arrangement')
assert {f['key'] for f in data['families'] if f['companionBars']}=={'crypt','archive','mine','abyss'}



# Cross-check actual retained chord context against original renderer's
# historical progression, not just the scores' own unvalidated labels.
old=json.loads((root/'tools/audio/score-book.json').read_text())
for fam in data['families']:
    reference=old['cues'][fam['id']]
    assert boss.verify_opening_harmony(fam,reference)==fam['harmony'][:4]
    wrong=copy.deepcopy(fam)
    wrong['harmony'][1]=(wrong['harmony'][1]+1)%7
    reject(lambda:boss.verify_opening_harmony(wrong,reference),
           'legacy opening harmony drift')
    assert fam['leadBars'][-1][-1][1]==0
for key in ('mire','archive'):
    fam=next(f for f in data['families'] if f['key']==key)
    assert boss.verify_true_register(fam)['range'][0]>=77
    wrong=copy.deepcopy(fam)
    wrong['trueRegister']=0
    reject(lambda:boss.verify_true_register(wrong),
           'TRUE chime requires stable written audible octave')
    far=copy.deepcopy(fam)
    far['trueRegister']+=12
    reject(lambda:boss.verify_true_register(far),
           'TRUE chime source pitch shift exceeds 4 semitones')
for fam in data['families']:
    assert boss.verify_true_chord_anchors(fam)>0
    changed=copy.deepcopy(fam)
    first=changed['trueChordAnchors'][0]-1
    accent=next(x for x in changed['trueBars'][first] if x[0]<=.4)
    accent[1]+=1
    reject(lambda:boss.verify_true_chord_anchors(changed),
           'TRUE accented chord anchor drift')
ridge=next(f for f in data['families'] if f['key']=='ridge')
assert boss.verify_true_register(ridge)['range'][1]<=71
wrong=copy.deepcopy(ridge);wrong['trueRegister']=12
reject(lambda:boss.verify_true_register(wrong),
       'TRUE cello would silently octave-fold')

# These adversarial note edits occur OUTSIDE the heritage opening, catching
# altered performed notes anywhere in the 12–20-bar full score and TRUE.
for fam in data['families']:
    for part in ('base','true'):
        written=boss.note_events(fam,part)
        altered=copy.deepcopy(written)
        altered[-1][1]+=12
        reject(lambda:guard.verify_heritage(written,altered,
                   cue=fam['id']+':'+part),
               'claimed-retained motif changed')

# Run a *second* time after actual rendering to cross-check per-note MIDI
# hashes captured at the recorded-sampler boundary, not declared only in JSON.
if len(sys.argv)>1:
    report=json.loads(Path(sys.argv[1]).read_text())
    listed={t['cue']:t for t in report['tracks']}
    assert set(listed)=={c['id'] for c in data['cues']}
    for fam in data['families']:
        for part in ('base','true'):
            key=fam['id'] if part=='base' else fam['trueId']
            raw=boss.note_events(fam,part)
            wanted=hashlib.sha256(json.dumps(raw,separators=(',',':')).encode()).hexdigest()
            assert listed[key]['soundedLeadSha256']==wanted,(key,'actual MIDI note drift')
            assert listed[key]['soundedLeadEvents']==len(raw)
    print('PASS actual MIDI instrument-boundary snapshots for all 16 full-form parts')

print('PASS Phase 5 adversarial mutations: full-form performed MIDI, original chords, chime/cello octave, clone/copy, protected scenes')
