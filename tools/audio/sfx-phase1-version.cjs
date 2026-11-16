'use strict';
// CI-only draft release metadata preparation. Does not publish or merge.
// Current published version is dev.288; the next staged source version is dev.289.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const before = '0.9.1+snapshot.dev.288';
const after = '0.9.1+snapshot.dev.289';
function read(file) { return fs.readFileSync(path.join(root,file),'utf8'); }
function write(file, data) { fs.writeFileSync(path.join(root,file),data); }
function exactly(text,from,to,where) {
  const first=text.indexOf(from);
  if (first<0 || text.indexOf(from,first+from.length)>=0)
    throw Error('Expected one exact location for '+where);
  return text.replace(from,to);
}
const pkg=JSON.parse(read('package.json'));
const lock=JSON.parse(read('package-lock.json'));
if (pkg.version!==before || lock.version!==before || lock.packages[''].version!==before)
  throw Error('Source version changed: reconcile exact main and replan dev.289 before integration');
pkg.version=after;
lock.version=after;lock.packages[''].version=after;
write('package.json',JSON.stringify(pkg,null,2)+'\n');
write('package-lock.json',JSON.stringify(lock,null,2)+'\n');
let state=read('docs/DEVELOPMENT_STATE.md');
state=exactly(state,'<!-- CURRENT_BUILD_VERSION: '+before+' -->','<!-- CURRENT_BUILD_VERSION: '+after+' -->','build marker');
const lines=state.split('\n');
const active=lines.findIndex(x=>x.startsWith('**Current code/build version:**'));
const row=lines.findIndex(x=>x.startsWith('| Build/cache version |'));
if (active<0 || row<0) throw Error('Development-state version anchors missing');
if (!lines[active].includes(before)||!lines[row].includes(before))
  throw Error('Development-state baseline is not original dev.288');
lines[active]='**Current code/build version:** `'+after+'` — **unmerged SFX Phase 1 release candidate on a separate branch**, not yet player-facing; future v0.9.2 remains a distinct functional-completion milestone. The last verified published build remains dev.288.';
lines[row]='| Build/cache version | **`'+after+'`** — unmerged sound-effects Phase 1 candidate | Generated from package metadata; not published. The last verified playable build remains dev.288. |';
state=lines.join('\n');
const heading='> **Current published build and v0.9.2 direction — 9 November 2026.**';
state=exactly(state,heading,
  '> **SFX Phase 1 unmerged release candidate — 16 November 2026.** Branch-only `'+after+'` replaces the original **30 existing recorded effect IDs**, keeping all prior masters and a per-ID rollback receipt under `tools/audio/sfx-legacy/dev288/`. It does **not** add new skill bindings, rewrite hero/enemy event stage contracts, alter save data or publish gameplay. [Implementation and safety contract](AUDIO_SFX_PHASE1_20261116.md). The **last verified published game remains dev.288**. Owner audio taste review is waived for Phase 1, but source/automated and real-device limits must be labeled accurately; a merge/Pages update needs applicable owner authorization.\n\n'+heading,'top status');
write('docs/DEVELOPMENT_STATE.md',state);
console.log('Staged source version '+after+'; kept verified published version '+before+'');
