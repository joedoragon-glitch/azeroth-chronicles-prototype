/* Dormant Field Lab verification against #770 native authored source truth.
 * Does not register a class, simulation tick, inventory or browser module.
 */
(function (root) {
  'use strict';
  const isPoint = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function create(materials, rules) {
    if (!materials || typeof materials.forGather !== 'function' ||
        typeof materials.findSource !== 'function' ||
        typeof materials.terrainSources !== 'function' ||
        typeof materials.propMaterial !== 'function')
      throw Error('Authentic source provider required');
    function verifySource(game, zoneId, material, id, anchor, workerPosition = null) {
      if (!game?.s?.zones || !isPoint(anchor) || typeof id !== 'string' ||
          !id || !['water', 'wood', 'mineral', 'fire'].includes(material) ||
          !['vale', 'march', 'highlands', 'frontier', 'crown'].includes(zoneId) ||
          (workerPosition && (!isPoint(workerPosition) ||
            dist(workerPosition, anchor) > 24))) return false;
      const zone = game.s.zones[zoneId];
      if (!zone || zone.id !== zoneId) return false;
      const authoredTerrain = materials.terrainSources(rules, zoneId,
        typeof game.regionIndex === 'function' ? game.regionIndex(zoneId) : -1);
      // Re-query exactly the previous sample point. Other sources, stale
      // indexed props, revoked fire or scenic artwork cannot satisfy receipt.
      const found = materials.findSource(game, material, {
        at: anchor, zone, rules, range: 0.1,
        access: (source, point) => {
          if (source.id !== id || !isPoint(point) || dist(point, anchor) > 0.1)
            return false;
          if (source.kind === 'prop')
            return Array.isArray(zone.props) &&
              zone.props.includes(source.prop) &&
              materials.propMaterial(source.prop, game.s.time) === material;
          if (source.kind === 'hazard') return false;
          return authoredTerrain.some((s) =>
            s.id === id && s.material === material && s.shape === source.shape);
        },
      });
      return found?.id === id && isPoint(found.point) &&
        dist(found.point, anchor) <= 0.1;
    }
    return Object.freeze({ materials, rules, verifySource });
  }
  const api = Object.freeze({ create });
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeStrategistLabSources = api;
})(typeof window !== 'undefined' ? window : globalThis);
