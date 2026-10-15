'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const expected = {
  highlands: { crown: 8, mounted: 4, banners: 4 },
  frontier: { crown: 10, mounted: 0, banners: 4 },
  crown: { crown: 12, mounted: 0, banners: 6 },
  mine: { crown: 10, mounted: 10, banners: 0 },
  citadel: { crown: 32, mounted: 0, banners: 0 },
  'supply-highlands': { crown: 6, mounted: 6, banners: 0 },
};
for (const [id, config] of Object.entries(expected)) {
  const c = new Campaign('normal', 'paladin', () => .9);
  c.enter(id);
  const z = c.zone(), roster = z.enemies.filter(e => e.crownTroop),
    mounted = z.enemies.filter(e => e.mountedCrownRider),
    nativeIDs = z.enemies.map(e => e.id).sort();
  assert.equal(roster.length, config.crown, id + ' selected existing State troops');
  assert.equal(mounted.length, config.mounted, id + ' reused existing rider identities');
  assert.equal(z.props.filter(p => p.regimeHeraldry).length, config.banners,
    id + ' heraldry density and no road-spanning banner spam');
  assert(roster.every(e => e.hp <= e.maxHp && e.level >= 1 && e.crownAncestry),
    'all Crown soldiers retain valid combat budgets');
  assert(z.enemies.filter(e => e.guard && !e.roomCaptain).every(e => e.xp === 0 && e.gold === 0),
    'guardian no-farm contract remains intact in ' + id);
  if (id === 'highlands') {
    assert(z.enemies.some(e => e.species === 'wolf' && !e.mountedCrownRider),
      'wild Highland wolves remain separate from paid direwolf cavalry');
    assert(roster.some(e => e.ranged) && roster.some(e => !e.ranged));
  }
  if (id === 'frontier') {
    assert(z.enemies.some(e => e.species === 'orc' && !e.crownTroop),
      'Frontier retains independent native warbands');
  }
  if (id === 'crown' || id === 'citadel') {
    assert.equal(roster.filter(e => e.ranged).length, config.crown / 2,
      'Crown soldiers have a real half-marksman / half-melee defense');
    assert(new Set(roster.map(e => e.crownAncestry)).size >= 5,
      'armored military remains multiracial');
  }
  const raw = c.snapshot(), restored = Campaign.restore(raw);
  restored.enter(id);
  assert.deepEqual(restored.zone().enemies.map(e => e.id).sort(), nativeIDs,
    id + ' did not add, duplicate, or revive soldiers on v4 restore');
  assert.equal(restored.zone().enemies.filter(e => e.crownTroop).length, config.crown);
  const oldProps = restored.zone().props.filter(e => e.regimeHeraldry).map(e => e.id);
  restored.zone();
  assert.deepEqual(restored.zone().props.filter(e => e.regimeHeraldry).map(e => e.id), oldProps,
    id + ' does not multiply its standards on repeated reads');
}
// Existing castle Crown troops keep both ancestral and royal maneuver
// repertoires, with one shared cast at a time rather than extra free attacks.
const c = new Campaign('normal', 'paladin', () => .9);
c.enter('citadel');
const e = c.zone().enemies.find(e => e.crownTroop &&
  e.crownAncestry === 'goblin' && !e.ranged);
assert(e, 'there is a Crown-armored goblin melee representative');
c.zone().enemies = [e];
c.s.party = [];
Object.assign(c.hero, { x: e.x + 72, y: e.y, hp: 10000, maxHp: 10000,
  level: e.level + 1, immune: 0 });
Object.assign(e, { aggro: true, cd: 100, summonCd: 100, rangedAim: null });
assert(c.tacticalRogueMove(e, c.hero));
const goblinMove = e.telegraph;
assert(goblinMove.mobileRogueCast, 'ancestral attack uses mobile bar');
assert.equal(goblinMove.name, Campaign.rules.tacticalFoundation.rogueMoves.species.goblin.name);
assert.equal(e.crownRogueTurn, 1);
e.telegraph = null;
assert(c.tacticalRogueMove(e, c.hero));
const crownMove = e.telegraph;
assert.equal(crownMove.name, Campaign.rules.tacticalFoundation.rogueMoves.species.crownguard.name);
assert.equal(e.crownRogueTurn, 0);
assert.equal(crownMove.coefficient,
  Campaign.rules.tacticalFoundation.rogueMoves.species.crownguard.coefficient,
  'no unapproved Crown damage amplification');
console.log('PASS core-region banners, selective native Crown roster, melee/ranged, saves and dual Rogue doctrine');
