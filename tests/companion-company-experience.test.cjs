'use strict';
// #620 interaction checks use the real menu catalog, actor ledger and trainer.
// A source-regex check cannot establish correct same-name navigation or payment.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus');
let game = new Campaign('normal', 'paladin', () => 0.9), screen, nameRequest = null;
const navigate = Menus.create({
  getGame: () => game, Campaign, D: Campaign.data,
  action: (label, action, detail = '', disabled = false) =>
    ({label, action, detail, disabled}),
  openMenu: (title, description, actions, back) => {
    screen = {title, description, actions, back};
  },
  closeMenu() {}, showMap() {}, finaleMenu() {},
  requestName: (request) => { nameRequest = request; },
});
const choose = (prefix) => {
  const row = screen.actions.find((a) => a.label.startsWith(prefix));
  assert(row, 'expected ' + prefix + ' in ' + screen.title + ': ' +
    screen.actions.map((a) => a.label).join('; '));
  assert(!row.disabled, prefix + ' should be available');
  row.action();
};
const b = {id: 'test-barracks', kind: 'barracks', progress: 4,
  x: game.hero.x, y: game.hero.y, full: true};
game.zone().buildings.push(b);
game.s.mercyTime = 0;
game.zone().enemies = [];
const soldier = game.s.party.find((u) => u.type === 'soldier');
assert(soldier, 'default company has a Soldier');
soldier.masteryPoints = 10;
navigate.barracksMenu(b);
choose('Company');
choose('Manage active group');
choose('Inspect · ');
assert.match(screen.title, /Companion/);
assert.match(screen.description, /Mastery 2.*10\/18 points/);
assert.match(screen.description, new RegExp(soldier.id));
const firstNameAction = screen.actions.find((a) => a.label === 'Choose permanent name');
assert(firstNameAction && !firstNameAction.disabled);
choose('Abilities & mastery');
assert(screen.actions.some((a) => a.label.includes('Power Strike')));
assert(screen.actions.some((a) => a.label.includes('Holy Cleave')));
screen.back();
assert.match(screen.title, /Companion/);
screen.back();
assert.equal(screen.title, 'Manage group');
choose('Previous page' === screen.actions[0]?.label ? 'Previous page' : 'Inspect · ');

// An owned pet must use the SAME per-individual ability reference.
game.s.true.thorn = true;
const pet = game.unit('pet', game.hero.x, game.hero.y, 'thorn');
game.s.party.push(pet);
navigate.barracksMenu(b);
choose('Company');
choose('Boss pet collection');
choose('Thornpup');
choose('Pet skills');
assert(screen.actions.some((a) => a.label.includes('Dynamic Entry')));
assert(screen.actions.some((a) => a.label.includes('Tripwire')));

// An authentic Charmed ledger with duplicated visible names, not forged
// species-wide actor identity; the trainer must address actor ID throughout.
game.s.charmCaptures ||= {};
const captures = [];
for (let j = 0; j < 12; j++) {
  const u = game.unit('soldier', game.hero.x + 10, game.hero.y + 10);
  const origin = {
    typeId: 'enemy:goblin:melee', species: 'goblin',
    role: 'soldier', typeName: 'Goblin',
    sourceEnemyId: 'enemy-' + (5000 + j),
    sourceZone: game.zoneId,
  };
  u.name = 'Goblin';
  u.charmOrigin = {...origin};
  u.active = false;
  game.s.party.push(u);
  game.s.charmCaptures[u.id] = {...origin};
  assert(game.isCharmedCompanion(u));
  captures.push(u);
}
game.s.rescued.ridge = true;
game.hero.gold = 99;
navigate.teacher({family: 'ridge', name: 'Orin'}, () => {});
choose('Charmed Ringleader Training');
assert.equal(screen.actions.filter((a) => a.label.includes('Goblin')).length, 8,
  'trainer chooser should paginate 8 at a time');
choose('Next page');
const target = captures[9];
const selected = screen.actions.find((a) => a.label.includes('[' + target.id + ']'));
assert(selected && !selected.disabled, 'same-name target selected by stable ID');
selected.action();
assert(screen.title.includes(target.id), 'Orin preview identifies the exact actor');
const confirm99 = screen.actions.find((a) => a.label.startsWith('Confirm training'));
assert(confirm99 && confirm99.disabled, '99 crowns cannot confirm');
screen.back();
assert(screen.actions.some((a) => a.label === 'Page' &&
  a.detail === '2/2'), 'Back restores trainer page 2');

game.hero.gold = 100;
// Exercise a fractional vitality multiplier where double-rounding diverges.
game.s.companionVitalityRank = 3;
game.syncCompanionLevelStats();
const hpBefore = game.companionMaxHp(target);
const hpAfter = game.companionMaxHp({...target, charmRingleaderTrained: true});
const attackBefore = game.companionAttackDamage(target);
const masteryBefore = target.masteryPoints;
const skill2Before = game.companionSecondSkillUnlocked();
selected.action();
assert(screen.description.includes('HP ' + hpBefore + ' → ' + hpAfter),
  'the preview must use the exact post-training HP calculation');
const confirm = screen.actions.find((a) => a.label.startsWith('Confirm training'));
assert(confirm && !confirm.disabled);
confirm.action();
assert.equal(game.hero.gold, 0, 'training charges exactly 100 once');
assert.equal(target.charmRingleaderTrained, true, 'only selected individual promoted');
assert.equal(target.maxHp, hpAfter,
  'the actual training HP must match the player-facing preview');
assert(Math.abs(game.companionAttackDamage(target) -
  attackBefore * Campaign.rules.ringleaderScaling.damage) < 0.0001);
assert.equal(target.masteryPoints, masteryBefore, 'paid training must not award Mastery');
assert.equal(game.companionSecondSkillUnlocked(), skill2Before,
  'paid training must not bypass the locked hero Skill 2');
assert.equal(captures.filter((u) => u.charmRingleaderTrained).length, 1);

// Already trained must remain inspectable, but cannot purchase again.
navigate.teacher({family: 'ridge', name: 'Orin'}, () => {});
choose('Charmed Ringleader Training');
choose('Next page');
screen.actions.find((a) => a.label.includes('[' + target.id + ']')).action();
assert.match(screen.description, /already received Ringleader Training/);
assert.equal(game.hero.gold, 0);

// No stale cross-run confirmation may charge an actor with the same recycled ID.
game.hero.gold = 200;
navigate.teacher({family: 'ridge', name: 'Orin'}, () => {});
choose('Charmed Ringleader Training');
choose('Next page');
screen.actions.find((a) => a.label.includes('[' + captures[10].id + ']')).action();
const stale = screen.actions.find((a) => a.label.startsWith('Confirm training'));
assert(stale && !stale.disabled);
const old = game;
game = new Campaign('normal', 'paladin', () => 0.9);
game.hero.gold = 200;
stale.action();
assert.equal(old.hero.gold, 200, 'old game never charged');
assert.equal(game.hero.gold, 200, 'replacement game never charged');
// A profile opened for a previous run must not name a new actor with a reused ID.
firstNameAction.action();
assert.equal(nameRequest, null, 'stale profile action never opens a new run name modal');
game = old;
firstNameAction.action();
assert(nameRequest && typeof nameRequest.onSubmit === 'function');
const newer = new Campaign('normal', 'paladin', () => 0.9);
game = newer;
assert.equal(nameRequest.onSubmit('Wrong Hero Ally'), false,
  'stale name confirmation must reject a different game instance');
assert.equal(newer.s.party[0].customName, undefined);
assert.equal(old.s.party[0].customName, undefined);
console.log('PASS #620 Barracks actor profiles, pet abilities, Orin pagination, exact identity and guarded purchase');
