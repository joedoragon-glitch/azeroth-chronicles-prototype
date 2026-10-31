#!/usr/bin/env python3
"""Mutation tests; metric/source correctness is NOT acoustic listening."""
import copy,importlib.util,json
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
print('PASS Phase 5 mutations: octave, onset, inherited pilot, lead-copy, cloned families and four old companions')
