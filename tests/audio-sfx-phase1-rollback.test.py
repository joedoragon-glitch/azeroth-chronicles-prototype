#!/usr/bin/env python3
"""Prove complete and partial SFX rollback in disposable independent workspaces."""
import hashlib, json, shutil, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
rollback=json.loads((ROOT/'tools/audio/sfx-phase1-rollback.json').read_text())
ids=sorted(rollback['originalEntries'])
assert len(ids)==30
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
def stage(temp):
    local=Path(temp)
    for dir in ['tools/audio/sfx-legacy/dev288','assets/audio/effects']:
        (local/dir).mkdir(parents=True,exist_ok=True)
    shutil.copyfile(ROOT/'tools/audio/sfx-phase1-master.py',
                    local/'tools/audio/sfx-phase1-master.py')
    shutil.copyfile(ROOT/'tools/audio/sfx-phase1-rollback.json',
                    local/'tools/audio/sfx-phase1-rollback.json')
    shutil.copyfile(ROOT/'assets/audio/manifest.json',local/'assets/audio/manifest.json')
    for key in ids:
        for directory in ['tools/audio/sfx-legacy/dev288','assets/audio/effects']:
            shutil.copyfile(ROOT/directory/f'{key}.wav',local/directory/f'{key}.wav')
    return local
def restore(root,selection,expect_good=True):
    process=subprocess.run([sys.executable,str(root/'tools/audio/sfx-phase1-master.py'),
                            '--restore',selection],cwd=root,text=True,
                           stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    if expect_good: assert process.returncode==0,process.stdout
    else: assert process.returncode!=0,process.stdout
with tempfile.TemporaryDirectory() as temp:
    p=stage(temp)
    chosen=ids[7]
    original=json.loads((p/'assets/audio/manifest.json').read_text())
    restore(p,chosen)
    after=json.loads((p/'assets/audio/manifest.json').read_text())
    for key in ids:
        expected=rollback['originalSha256'][key] if key==chosen else original['assets'][key]['sha256']
        assert sha(p/'assets/audio/effects'/f'{key}.wav')==expected
        assert after['assets'][key]==(rollback['originalEntries'][key] if key==chosen else original['assets'][key])
    restore(p,'all')
    final=json.loads((p/'assets/audio/manifest.json').read_text())
    for key in ids:
        assert final['assets'][key]==rollback['originalEntries'][key]
        assert sha(p/'assets/audio/effects'/f'{key}.wav')==rollback['originalSha256'][key]
with tempfile.TemporaryDirectory() as temp:
    p=stage(temp)
    key=ids[3]
    archive=p/'tools/audio/sfx-legacy/dev288'/f'{key}.wav'
    archive.write_bytes(archive.read_bytes()+b'corruption')
    restore(p,key,expect_good=False)
    manifest=json.loads((p/'assets/audio/manifest.json').read_text())
    assert manifest['assets'][key]['sha256']!=rollback['originalSha256'][key]
    assert sha(p/'assets/audio/effects'/f'{key}.wav')==manifest['assets'][key]['sha256']
print('PASS: complete 30-ID rollback, one-ID rollback, unchanged other IDs, and corrupt-backup failure')
