'use strict';
// Explicitly regenerated synthetic fixtures, never player exports. Historical
// engines run in separate processes; no current layout code manufactures inputs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const zlib = require('node:zlib');
const { rng } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..');
if (!process.argv.includes('--source')) {
  const output = process.argv[2];
  if (!output || fs.existsSync(output)) throw Error('Supply a NEW explicit output path');
  const refs = {
    expanded: 'bda30dabd8701f2826b50401ec54213118494433',
    rollback: 'fcc1f428df652c7470914f3465bebf56afffbb71',
  };
  const saves = [],
    sources = {};
  let expandedSaves;
  for (const [name, ref] of Object.entries(refs)) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'greenwood-source-'));
    try {
      const archive = cp.execFileSync('git', ['archive', ref, 'src/prototype'], {
        cwd: root,
        maxBuffer: 16 * 1024 * 1024,
      });
      cp.execFileSync('tar', ['-xf', '-', '-C', dir], { input: archive });
      const data = JSON.parse(
        cp.execFileSync(
          process.execPath,
          [__filename, '--source', dir, ...(name === 'rollback' ? ['--convert-expanded'] : [])],
          {
            cwd: root,
            input: name === 'rollback' ? JSON.stringify(expandedSaves) : undefined,
            encoding: 'utf8',
            maxBuffer: 16 * 1024 * 1024,
          },
        ),
      );
      if (name === 'expanded') expandedSaves = data;
      saves.push(...data.map(([id, s]) => [name + ':' + id, s]));
      sources[name] = {
        commit: ref,
        geometry:
          name === 'expanded'
            ? 'dev.233 geometry in dev.234 engine'
            : 'Native dev.235 inverse restore of those expanded inputs, sourceVersion=0 and rollbackVersion=1',
        preparation:
          'Native build/work/gather/interior actions, controlled legal actor staging and explicit progression prerequisites; synthetic, not a sustained playthrough or player export',
      };
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  fs.writeFileSync(output, zlib.gzipSync(JSON.stringify({ sources, saves })));
  console.log('Saved ' + saves.length + ' source-pinned synthetic lifecycle inputs');
  process.exit(0);
}
const dir = process.argv[process.argv.indexOf('--source') + 1];
const C = require(path.join(dir, 'src/prototype/engine.js'));
if (process.argv.includes('--convert-expanded')) {
  const inputs = JSON.parse(fs.readFileSync(0, 'utf8'));
  fs.writeFileSync(
    1,
    JSON.stringify(
      inputs.map(([name, raw]) => {
        const g = C.restore(raw, rng(0x47564102)),
          s = g.snapshot();
        assert.equal(s.zones.vale.greenwoodRollbackVersion, 1);
        assert.equal(s.zones.vale.greenwoodSourceVersion, 0);
        return [name, s];
      }),
    ),
  );
  process.exit(0);
}
const saves = [];
const fresh = () => {
  const g = new C('normal', 'paladin', rng(0x47564102));
  g.hero.gold = 4321;
  g.s.expeditionRank = 4;
  return g;
};
const stage = (g, unit, p) => Object.assign(unit, g.safe(p.x, p.y));
const advanceWork = (g, seconds) => {
  for (let j = 0; j < Math.round(seconds * 10); j++) g.updateParty(0.1);
};
{
  const g = fresh(),
    entrance = g.zone().npcs.find((n) => n.kind === 'dungeon' && n.family === 'crypt');
  stage(g, g.hero, entrance);
  assert(g.prepareDungeonCamp(entrance), g.messages.join(';'));
  const b = g.zone().buildings.at(-1),
    u = g.s.party.find((u) => u.order?.id === b.id);
  stage(g, u, { x: b.x + 55, y: b.y });
  advanceWork(g, 1.3);
  assert(b.progress > 0 && b.progress < 4);
  const snap = g.snapshot();
  assert(
    snap.party.some((u) => u.order?.type === 'build'),
    'native persistent recovery build',
  );
  saves.push(['partial-recovery-camp', snap]);
  advanceWork(g, 3);
  assert.equal(b.progress, 4);
  assert(g.upgradeBarracks(b.id));
  advanceWork(g, 1.2);
  assert(b.upgradePaid && b.upgradeProgress > 0 && !b.full);
  saves.push(['paid-partial-upgrade', g.snapshot()]);
}
{
  const g = fresh(),
    z = g.zone(),
    node = z.nodes.find((n) => !n.hidden && !n.mini);
  assert(node, 'unlocked native tribute source');
  // Controlled already-cleared worksite; native kill owns rewards/pending facts.
  for (const e of z.enemies.filter(
    (e) => e.hp > 0 && Math.hypot(e.x - node.x, e.y - node.y) < 650,
  )) {
    e.hp = 0;
    e.heroParticipated = true;
    g.kill(e);
  }
  assert(g.gather(node.id));
  for (const u of g.s.party.filter((u) => u.order?.type === 'gather'))
    stage(g, u, { x: node.x + 30, y: node.y + 10 });
  advanceWork(g, 2);
  assert(
    g.s.party.some((u) => u.carry > 0),
    'native worker loaded cargo',
  );
  saves.push(['worker-loaded', g.snapshot()]);
  for (let j = 0; j < 200 && !g.s.party.some((u) => u.order?.type === 'deposit'); j++)
    advanceWork(g, 0.1);
  advanceWork(g, 0.1);
  for (const u of g.s.party.filter((u) => u.order?.type === 'deposit'))
    stage(g, u, { x: node.x + 250, y: node.y + 200 });
  advanceWork(g, 0.2);
  const snap = g.snapshot();
  assert(
    snap.party.some((u) => u.order?.journey?.points.length > 1),
    'native saved journey breadcrumb',
  );
  saves.push(['worker-journey', snap]);
}
for (const zone of ['crypt', 'supply-vale', 'side-vale-cellars']) {
  const g = fresh();
  assert(g.enter(zone));
  saves.push(['inside-' + zone, g.snapshot()]);
}
console.log(JSON.stringify(saves));
