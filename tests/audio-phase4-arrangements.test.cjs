'use strict';
// Phase 4 source/ID/clock/prototype/recording-contract gate only.
// Passing this test NEVER demonstrates that someone actually heard the music.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const phase4 = read('tools/audio/phase4-arrangements.json');
const phase3 = read('tools/audio/phase3-themes.json');
const pilots = read('tools/audio/phase2-pilots-v2.json');
const catalog = read('assets/audio/manifest.json');
const frozen = read('tools/audio/phase2-crown-freeze.json').frozen;
const registered = Object.entries(catalog.assets).filter(([, a]) => a.kind === 'music').map(([id]) => id);
const stable = new Set(registered);
const crown = new Set(Object.keys(frozen));
const entries = phase4.arrangements;
const inScope = new Set(registered.filter(id => !crown.has(id)));
const ids = entries.map(c => c.id);
const originals = new Set(phase3.themes.map(t => t.id));
const phase5 = registered.filter(id => id.startsWith('boss-') && !crown.has(id));
const phase6 = new Set(['title', 'defeat', 'finale']);
assert.equal(phase4.schemaVersion, 1);
assert.equal(entries.length, 38, 'Historical 42 is mathematically wrong');
assert.equal(new Set(ids).size, 38);
assert.equal(registered.length, 83);
assert.equal(crown.size, 18);
assert.equal(inScope.size, 65);
assert.equal(originals.size, 8);
assert.equal(phase5.length, 16);
assert.equal(phase6.size, 3);
const covered = new Set([...ids, ...originals, ...phase5, ...phase6]);
assert.deepEqual([...covered].sort(), [...inScope].sort(),
  '38 Phase 4 arrangements plus 8 bases + 16 bosses + 3 story must cover exactly 65');
assert(ids.every(id => stable.has(id) && !crown.has(id)));
assert.deepEqual(Object.fromEntries(['action','peace','night','settlement','interior','interior-peace']
  .map(kind => [kind, entries.filter(c=>c.kind===kind).length])),
  {action:8,peace:8,night:4,settlement:4,interior:7,'interior-peace':7});
assert(phase4.peaceActivation.includes('global ending PLUS throne'));
for (const cue of entries) {
  assert(cue.sceneIntent.length >= 48);
  assert(cue.form.length === cue.bars && cue.form.includes('H') && cue.form.includes('A'));
  assert(cue.form.includes('R'));
  assert(cue.arc.length === 4);
  assert(cue.answer.length >= 2 && cue.question.length >= 2);
  const base = phase3.themes.find(x => x.id === cue.parent);
  if (base) {
    const parentPilot = pilots.families.find(x => x.family === base.pilotFamily);
    assert.equal(cue.bpm, base.bpm ?? parentPilot.bpm, cue.id);
    assert.equal(cue.bars, base.bars ?? parentPilot.bars, cue.id);
  } else {
    const room = phase4.interiors[cue.parent];
    assert(room && room.harmony.length === cue.bars, cue.id);
  }
}
const inherited = ['action-vale', 'action-archive',
  'interior-side-vale-cellars', 'peace-interior-side-vale-cellars'];
assert(inherited.every(id => ids.includes(id)),
  'Every inherited Phase 2 pilot needs fresh Phase 4 authorship');
assert(new Set(entries.map(c => c.sceneIntent)).size === 38,
  'Each arrangement must have its own situated dramatic goal');
const check = cp.spawnSync('python3', ['tools/audio/phase4-compose.py','--check'], {
  cwd:root, encoding:'utf8', timeout:120000
});
if (check.stdout) process.stdout.write(check.stdout);
if (check.stderr) process.stderr.write(check.stderr);
assert.equal(check.status, 0, String(check.error || check.signal || check.status));
console.log('PASS Phase 4 38-cue source/clock/heritage/Crown guard; not a musical audition');
