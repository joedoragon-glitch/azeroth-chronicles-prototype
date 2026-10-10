'use strict';
// Exact occlusion broad phase at shared baseline c6ce1af236bddd7ca881903499c4cf5de175f9e2.
// Retained only for independent differential tests and paired measurements.
function majorOccluder(e) {
  if (!e || e.interactionOnly) return false;
  if (e.renderKind === 'building') return true;
  if (e.renderKind === 'npc')
    return ['rest', 'supplier', 'recruiter', 'mini', 'dungeon', 'exit'].includes(e.kind);
  if (e.renderKind !== 'prop') return false;
  const structure = String(e.structure || '');
  if (/(?:^|-)(?:sapling|stump|shrub|grass|flowers|log|post|barrel|crate)(?:-|$)/.test(structure))
    return false;
  return (
    /(?:^|-)(?:house|cottage|workshop|smithy|hut|lodge|hall|tower|watchhouse|watchpost|keep|fort|fortress|gatehouse|barracks|chapel|command-tent|tree|wall|stonewall|stockade|palisade)(?:-|$)/.test(
      structure,
    ) ||
    (['🌲', '🌳', '🪨'].includes(e.icon) && Number(e.r) >= 18)
  );
}

// The sorted draw order remains authoritative: an obstacle only hides an actor
// when it is actually painted after that actor.
function occlusionPairs(entities, project, height) {
  const pairs = [];
  for (let i = 0; i < entities.length; i++) {
    const actor = entities[i];
    if (
      !['hero', 'ally', 'enemy'].includes(actor.renderKind) ||
      actor.interactionOnly ||
      (actor.renderKind === 'enemy' && (actor.hp <= 0 || actor.neutral))
    )
      continue;
    const p = project(actor),
      front = [];
    for (let j = i + 1; j < entities.length; j++) {
      const obstacle = entities[j];
      if (!majorOccluder(obstacle) || obstacle.x + obstacle.y <= actor.x + actor.y) continue;
      const q = project(obstacle),
        dy = q.y - p.y;
      // Broad phase only. The actual artwork's alpha is intersected below,
      // preventing a contour from appearing across empty sprite padding.
      if (dy < 0 || dy > Math.max(100, height(obstacle) + 44) || Math.abs(q.x - p.x) > 155)
        continue;
      front.push({ entity: obstacle, position: q });
      if (front.length === 8) break;
    }
    if (front.length) pairs.push({ actor, position: p, front });
  }
  // The party takes priority on busy screens; the effect is intentionally bounded.
  return pairs
    .sort(
      (a, b) =>
        (a.actor.renderKind === 'hero' ? 0 : a.actor.renderKind === 'ally' ? 1 : 2) -
        (b.actor.renderKind === 'hero' ? 0 : b.actor.renderKind === 'ally' ? 1 : 2),
    )
    .slice(0, 12);
}

module.exports = { majorOccluder, occlusionPairs };
