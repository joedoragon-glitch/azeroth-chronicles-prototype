'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  zlib = require('node:zlib');
const C = require('./fixtures.cjs').loadRuntime();
const { rng, clone } = require('./fixtures.cjs');
// Save fixtures originate on the unchanged 2700 source, BEFORE proposals mutate tables.
const baseline = new C('normal', 'paladin', rng(0x47564101));
baseline.build();
const freshSave = baseline.snapshot();
const progressed = clone(freshSave);
progressed.hero.gold = 777;
progressed.quests['quest-1'].count = 2;
progressed.zones.vale.nodes[0].amount = 77;
progressed.zones.vale.enemies.find((e) => e.type === 'mob' && !e.guard).hp = 0;
// Admit the native field boss, defeat that exact actor and rescue its actual
// captive. Setting flags around the hidden level-1 thornArrival is not a
// representative historical campaign and would manufacture a revival defect.
const victorious = C.restore(progressed, rng(0x47564102));
victorious.hero.level = C.rules.fieldOnboarding.spawnLevel;
let vz = victorious.zone();
const boss = vz.enemies.find((e) => e.type === 'boss' && e.family === 'thorn');
if (!boss) throw Error('Native field boss was not admitted');
boss.hp = 0;
boss.heroParticipated = true;
victorious.kill(boss);
const captive = vz.npcs.find((n) => n.kind === 'cage' && n.family === 'thorn');
if (!captive) throw Error('Native Mira cage missing');
Object.assign(victorious.hero, { x: captive.x, y: captive.y });
if (!victorious.interact(captive) || !victorious.s.rescued.thorn)
  throw Error('Native rescue failed');
vz.nodes[1].amount = 0;
const defeated = victorious.snapshot();
const working = clone(progressed);
working.party[0].order = { type: 'gather', id: working.zones.vale.nodes[0].id };
working.party[0].carry = 7;
working.party[0].resourceGroup = working.zones.vale.nodes[0].resourceGroup;
const edge = clone(progressed);
edge.hero.x = 1120;
edge.hero.y = 1750;
const saves = [
  ['current-source-fresh-Barracks', freshSave],
  ['current-source-partial-tribute-kill', progressed],
  ['current-source-boss-rescued', defeated],
  ['current-source-crossing-edge', edge],
  ['current-source-worker-carrying', working],
];
fs.writeFileSync(
  process.argv[2] ||
    (() => {
      throw Error(
        'Supply an explicit output path; never overwrite archived baseline fixture inputs',
      );
    })(),
  zlib.gzipSync(
    JSON.stringify({
      provenance:
        'Synthetic fixtures constructed on pinned unmodified main, not player exports; current runtime-owned snapshot normalization applies',
      saves,
    }),
  ),
);
