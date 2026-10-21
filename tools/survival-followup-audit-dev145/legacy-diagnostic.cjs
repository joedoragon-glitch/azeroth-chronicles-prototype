// Review-only fixture diagnostics. Repository tests and runtime are never edited.
// Usage: node tools/survival-followup-audit-dev145/legacy-diagnostic.cjs <suite-name>
// Diagnostic passes are NOT passes of the unmodified legacy suites.
// Nightmare fixtures advance past the authored sunset. Native Dreadmaw dispatch
// gets roomCaptain. Hash gates are omitted only to reach behavioral assertions.
// Snapshot diagnostics resume at cleanup (earlier mechanics reached that point),
// and inspect the roster replacement after travel, not the detached old object.
// Cindermaw direct forced Cordon cases use a nearby native valid position where
// matched, or an explicit bounded open arena if their direct setup is invalid.
// The final unforced selector remains in native roost terrain.
'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  Module = require('node:module');
const root = path.resolve(__dirname, '../..');
const name = process.argv[2],
  file = path.join(root, 'tests', name + '.test.cjs');
let s = fs.readFileSync(file, 'utf8');
if (name === 'night-ringleader-rogue')
  s = s.replace('c.s.clock = 500;', 'c.s.clock = 500; c.s.nightmareIntroRemaining = 0;');
if (name === 'enemy-support-healing')
  s = s.replace(
    "const { g, mob } = fixture('vale', 'nightmare');",
    "const { g, mob } = fixture('vale', 'nightmare'); g.s.nightmareIntroRemaining = 0;",
  );
if (name === 'snapshot-dreadmaw')
  s =
    s.slice(0, s.indexOf('// Reconstruct the protected original')) +
    s.slice(s.indexOf('const plans = C.rules.roomCaptains'));
if (name === 'cindermaw-ministry')
  s = s
    .replace(
      'function cast(c, e, slot, resolve = true) {',
      'function cast(c, e, slot, resolve = true) { if(slot===0 && !c.cinderGapPlan(e,c.hero)) { c.zone().props=[]; c.blocked=(x,y,z,r=15)=>x<r||y<r||x>c.zoneSize()-r||y>c.zoneSize()-r; }',
    )
    .replace(
      'const a = cast(c, e, 0);',
      `const native = c.cinderGapPlan(e,c.hero); if (!native) {
 let found=false;
 const start={x:e.x,y:e.y};
 for(const radius of [60,120,180,240,300]) { for(let i=0;i<24;i++) {const p={x:start.x+Math.cos(i*Math.PI/12)*radius,y:start.y+Math.sin(i*Math.PI/12)*radius}; if(c.blocked(p.x,p.y,c.zoneId,15)||!c.clearSegment(e,p,15))continue;Object.assign(e,p);Object.assign(c.hero,c.safe(e.x+70,e.y));if(c.cinderGapPlan(e,c.hero)){found=true;break;}}if(found)break;Object.assign(e,start); }
 assert(found,'bounded native terrain admits a Cordon test position');
 } const a = cast(c, e, 0);`,
    );
if (name === 'enemy-withdrawal-actions')
  s = s
    .replace(
      'captain: true, captainProfile: id',
      "captain: true, roomCaptain: id === 'supply-crown', captainProfile: id",
    )
    .replace(
      "assert(a?.withdrawal, id + ' starts a skill');",
      "assert(a?.withdrawal, id + ' starts a skill'); if(id === 'supply-crown') assert(a.dreadMechanic,'native Dreadmaw dispatch');",
    );
if (name === 'snapshot-dreadmaw') {
  s =
    s.slice(0, s.indexOf('let realCasts')) +
    'let realCasts=0;\n' +
    s.slice(s.indexOf('// Save/raw restore/travel/cancel'));
  s = s.replace(
    "    assert(!e.dreadClosure);\n    assert(!e.dreadVapors);\n    if (end !== 'peace')",
    "    const checked = end === 'travel' ? c.s.zones['supply-crown'].enemies.find(u=>u.id === e.id) : e; assert(checked);\n    assert(!checked.dreadClosure);\n    assert(!checked.dreadVapors);\n    if (end !== 'peace')",
  );
}
const m = new Module(file, module);
m.filename = file;
m.paths = Module._nodeModulePaths(path.dirname(file));
m._compile(s, file);
