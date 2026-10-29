/* Restore Greenwood's original 2700-unit layout without undoing other regions.
 * The shipped 3200-unit spatial migration is reversed once on v4 restores.
 */
(function (root) {
  'use strict';
  const extra = 500;
  const xKnots = [[0,0],[300,0],[900,0.45],[1200,0.7],[2700,1]];
  const yKnots = [[0,0],[350,0],[700,0.3],[1750,0.65],[2700,1]];
  function axis(v, knots, reverse = false) {
    for (let i = 1; i < knots.length; i++) {
      const [a, da] = knots[i - 1], [b, db] = knots[i];
      if (reverse) {
        const start = a + extra * da, end = b + extra * db;
        if (v <= end) return a + (v - start) * (b - a) / (end - start);
      } else if (v <= b) return v + extra * (da + (db - da) * (v - a) / (b - a));
    }
    return reverse ? v - extra : v + extra;
  }
  const projection = {
    x: (x) => axis(x, xKnots),
    y: (y) => axis(y, yKnots),
    oldX: (x) => axis(x, xKnots, true),
    oldY: (y) => axis(y, yKnots, true),
  };
  function install(C, { R }) {
    C.prototype.greenwoodRestoreLegacy = function (z) {
      if (z.id !== 'vale' || z.greenwoodSourceVersion !== 1 || z.greenwoodRollbackVersion === 1) return;
      const groups = new Map();
      for (const h of R.creatureStrongholds.filter((h) => h.region === 'vale')) {
        const site = R.sites[0].find((s) => s[0] === h.site);
        const old = h.center || site?.slice(2, 4);
        if (!old) continue;
        const before = { x: old[0], y: old[1] };
        groups.set(h.id, { before, after: { x: projection.x(before.x), y: projection.y(before.y) } });
      }
      const goblinBefore = { x: 520, y: 1050 };
      const goblinAfter = { x: projection.x(400), y: projection.y(1550) };
      if (groups.has('goblin-road-fort')) groups.get('goblin-road-fort').after = goblinAfter;
      groups.set('goblin-road-camp', { before: goblinBefore, after: goblinAfter });
      const seen = new Set();
      const move = (p, inherited) => {
        if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || seen.has(p)) return;
        seen.add(p);
        const group = inherited || groups.get(p.stronghold || p.habitat);
        if (group) {
          p.x += group.before.x - group.after.x;
          p.y += group.before.y - group.after.y;
        } else {
          p.x = projection.oldX(p.x);
          p.y = projection.oldY(p.y);
        }
        if (p.home) move(p.home, group);
        if (p.servicePoint) move(p.servicePoint, group);
        if (p.order && Number.isFinite(p.order.x)) move(p.order, group);
        for (const k of ['path', 'pathTarget', 'idleWanderTarget']) delete p[k];
      };
      for (const p of [...z.props, ...z.npcs, ...z.enemies, ...z.nodes, ...z.buildings]) move(p);
      for (const p of z.minis || []) { move(p); if (p.center) move(p.center); }
      if (z.thornArrival) { move(z.thornArrival.boss); move(z.thornArrival.captive); }
      for (const p of this.s.loot || []) if (p.zone === z.id) move(p);
      for (const p of Object.values(this.s.pending || {})) if (p.zone === z.id) move(p.base);
      if (this.s.refugeSite?.zone === z.id) move(this.s.refugeSite);
      if (this.s.zone === z.id) for (const p of [this.hero, ...this.s.party]) move(p);
      // Remove only new flagship scenery, not the user's saved structures.
      z.props = z.props.filter((p) =>
        p.greenwoodScene !== true &&
        !String(p.id || '').startsWith('greenwood-') &&
        !/^forest-[345]-/.test(String(p.id || ''))
      );
      for (const p of z.props) {
        delete p.greenwoodLegacyScenery;
        delete p.greenwoodReserved;
      }
      for (const n of z.npcs) {
        if (n.id === 'minor') {
          n.x = 900; n.y = 700; n.servicePoint = { x: 900, y: 700 };
        } else if (n.id === 'orchard') {
          n.x = 1050; n.y = 740; n.name = 'Abandoned orchard';
        } else if (n.id === 'mill-pond') {
          n.x = 780; n.y = 1320;
        } else if (n.id === 'goblin-camp') {
          n.x = 520; n.y = 1050;
        }
      }
      if (this.s.refugeSite?.zone === z.id && this.s.refugeSite.id === 'minor')
        Object.assign(this.s.refugeSite, { x: 900, y: 700 });
      z.roads = [];
      z.footpaths = [];
      delete z.bridgeApproaches;
      for (const k of [
        'roadVersion','environmentCoherenceVersion','landmarkRoadShoulderVersion',
        'streetClearanceVersion','townVisualClearanceVersion',
        'greenwoodFrontageVersion','greenwoodFrontageRoadVersion',
        'greenwoodSceneVersion','greenwoodSceneAudit','greenwoodAttemptVersion',
        'millhavenOnboardingVersion','settlementLayoutVersion',
      ]) delete z[k];
      // One-time reverse-migration receipt. Source version remains as history.
      z.greenwoodRollbackVersion = 1;
    };
  }
  const api = { projection, install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeGreenwood = api;
})(typeof window !== 'undefined' ? window : globalThis);
