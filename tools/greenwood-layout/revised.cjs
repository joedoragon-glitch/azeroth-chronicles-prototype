'use strict';
const cp = require('node:child_process');
if (!process.argv[2]) {
  for (const size of [3200, 3400])
    cp.execFileSync(process.execPath, [__filename, String(size)], { stdio: 'inherit' });
  process.exit(0);
}
const C = require('./fixtures.cjs').loadRuntime(Number(process.argv[2]), true);
const G = require('../../src/prototype/greenwood');
const { rng } = require('./fixtures.cjs');

G.install(C, { D: C.data, R: C.rules });
for (const seed of [0x47564101, 0x47564102, 0x47564103, 0x47564104]) {
  const g = new C('normal', 'paladin', rng(seed)),
    z = g.zone();
  console.log(
    JSON.stringify({
      size: g.zoneSize(),
      seed,
      props: z.props.length,
      sceneVersion: z.greenwoodSceneVersion,
      missing: z.greenwoodSceneAudit?.filter((p) => p.essential && !p.placed),
      badSetbacks: z.props
        .filter((p) => g.distanceToRoad(z, p) + 0.01 < g.roadSetback(p))
        .map((p) => ({ id: p.id, actual: g.distanceToRoad(z, p), required: g.roadSetback(p) })),
      hamlet: z.npcs.find((n) => n.id === 'minor'),
      mill: z.props.find((p) => p.id === 'greenwood-working-mill'),
      routes: z.npcs
        .map((n) => {
          const p = n.servicePoint || n,
            ps = g.route(g.hero, p);
          return {
            id: n.id,
            ok: !!ps.length && Math.hypot(ps.at(-1).x - p.x, ps.at(-1).y - p.y) < 35,
          };
        })
        .filter((r) => !r.ok),
    }),
  );
}
