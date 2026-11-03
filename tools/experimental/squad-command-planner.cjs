'use strict';
// DORMANT SIBDLP squad-command prototype, Issue #684. Not imported by live game.
// The engine, HUD and campaign saves do not consume these proposals.
const KINDS = Object.freeze(['move', 'attack', 'defend']);
const point = (x) => x && Number.isFinite(x.x) && Number.isFinite(x.y);
const id = (x) => typeof x === 'string' && x.length > 0 && x.length <= 128;
const eligibleEnemy = (e, zone) => e && id(e.id) && e.hp > 0 &&
  !e.neutral && !e.returning && (e.zone === undefined || e.zone === zone);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function createSquadCommand(kind, fields = {}) {
  if (!KINDS.includes(kind)) throw Error('Unknown squad command');
  if (kind === 'move') {
    if (!point(fields.destination)) throw Error('Squad move needs a point');
    const { x, y } = fields.destination;
    return Object.freeze({ kind, destination: Object.freeze({ x, y }) });
  }
  if (kind === 'attack') {
    if (!id(fields.enemyId)) throw Error('Squad attack needs an enemy ID');
    return Object.freeze({ kind, enemyId: fields.enemyId });
  }
  return Object.freeze({ kind });
}
// Pure design-only planner: returns intents, NEVER moves or casts on actors.
// heroThreatIds MUST be issued by actual enemy-victim resolution; aggro alone
// cannot establish that an enemy is specifically attacking the hero.
// Future live integration must independently validate navigation, geometry,
// skills, line of sight, encounter, party jobs, Recall and zone boundaries.
function planSquadCommand({ command, hero, companions, enemies, zone,
  recallActive = false, heroThreatIds = [] }) {
  if (!point(hero) || !id(zone)) throw Error('Invalid squad scene');
  if (!Array.isArray(companions) || !Array.isArray(enemies)) throw Error('Invalid squad roster');
  if (!Array.isArray(heroThreatIds) || heroThreatIds.some((key) => !id(key)))
    throw Error('Invalid hero threat receipts');
  if (!command || !KINDS.includes(command.kind)) throw Error('Invalid squad command');
  const current = createSquadCommand(command.kind, command);
  const living = companions.filter((u) => u && id(u.id) && u.hp > 0 && u.active !== false);
  if (recallActive) return living.map((u) =>
    Object.freeze({ companionId: u.id, intent: 'recall' }));
  if (current.kind === 'move') return living.map((u) => Object.freeze({
    companionId: u.id, intent: 'move-formation', anchor: current.destination,
  }));
  if (current.kind === 'attack') {
    const target = enemies.find((e) => e.id === current.enemyId && eligibleEnemy(e, zone));
    return living.map((u) => Object.freeze(target
      ? { companionId: u.id, intent: 'focus-enemy', enemyId: target.id }
      : { companionId: u.id, intent: 'escort-hero' }));
  }
  const threatening = new Set(heroThreatIds);
  const candidates = enemies.filter((e) => eligibleEnemy(e, zone) &&
    threatening.has(e.id) && point(e));
  candidates.sort((a, b) => distance(a, hero) - distance(b, hero) ||
    a.id.localeCompare(b.id));
  return living.map((u) => Object.freeze(candidates.length
    ? { companionId: u.id, intent: 'protect-hero', enemyId: candidates[0].id }
    : { companionId: u.id, intent: 'escort-hero' }));
}
module.exports = { KINDS, createSquadCommand, planSquadCommand };
