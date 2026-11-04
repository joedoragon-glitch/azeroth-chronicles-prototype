'use strict';
// Historical reference ONLY. This tool is NOT loaded by the live game.
// Original hero 'attack' orders approached to 105/350/350/220 and then
// repeatedly used manual Skill 1, irrespective of the modern basic-attack
// acquisition and manual skill contracts. Kept for possible future recycling.
// Do not reintroduce it into the live Campaign without a new design decision.
const approach = Object.freeze({ paladin: 105, mage: 350, ranger: 350, rogue: 220 });
function historicalHeroAttackOrderStep(game, target, dt) {
  const h = game.hero;
  if (!target || target.hp <= 0 || target.neutral || !game.tacticalDirectTargetable(target))
    return false;
  const reach = approach[h.class];
  if (!Number.isFinite(reach)) return false;
  if (Math.hypot(h.x - target.x, h.y - target.y) > reach) {
    game.follow(
      h, target,
      game.heroMoveSpeed() *
        (h.haste > 0 ? 1.25 : 1) *
        game.slowMovementFactor(h) *
        game.mireBogMovementFactor(h) *
        game.ashMovementFactor(h),
      dt, 20,
    );
  } else {
    game.cast(1, target.id); // Legacy manual Skill 1 coupling, NOT live.
  }
  return true;
}
module.exports = { approach, historicalHeroAttackOrderStep };
