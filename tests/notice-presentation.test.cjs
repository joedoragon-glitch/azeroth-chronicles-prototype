'use strict';
// Run the actual shell notice updater with a clock/DOM adapter: no copied queue.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const source = fs.readFileSync('src/prototype/app.js', 'utf8');
const start = source.indexOf('  function updateCriticalNotice() {');
const end = source.indexOf('  const developerSummonButton', start);
function element() {
  const classes = new Set();
  return {
    children: [],
    style: {},
    classList: {
      toggle(k, on) {
        on ? classes.add(k) : classes.delete(k);
      },
      contains: (k) => classes.has(k),
    },
    replaceChildren(...c) {
      this.children = c;
    },
    append(c) {
      this.children.push(c);
    },
    setAttribute() {},
    getBoundingClientRect: () => ({ left: 12, right: 264, top: 8, bottom: 70 }),
  };
}
const host = element(),
  status = element();
let clock = 0;
const game = {
  hero: { x: 0, y: 0, hp: 100 },
  s: { projectiles: [], hazards: [], challenge: {} },
  notices: [],
  zone: () => ({ enemies: game.enemies }),
  enemies: [],
  activeLivingParty: () => [],
  attackResetProtected: require('../src/prototype/engine.js').prototype.attackResetProtected,
  roamingBoss: () => false,
  fieldBossReturning: () => false,
};
const context = {
  game,
  criticalNotices: {},
  performance: { now: () => clock },
  $: (id) => (id === 'message' ? host : status),
  document: { hidden: false, createElement: element },
  platform: { mode: 'phone' },
  menu: null,
  paused: false,
  focused: true,
  tr: (text) => text,
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);
const update = () => context.updateCriticalNotice();
let id = 0;
const add = (kind = 'narration') => {
  game.notices.push({ id: ++id, text: 'Long reading '.repeat(12), duration: 6.8, kind });
  return id;
};
const visible = () => Array.from(context.criticalNotices.active, (n) => n.kind);
const threat = { x: 50, y: 0, hp: 100, aggro: true };
game.enemies = [threat];
add();
add('milestone');
update();
assert.equal(host.children.length, 0, 'story and milestones wait through combat');
game.enemies = [];
clock = 2499;
update();
assert.equal(host.children.length, 0, 'quiet interval must finish');
clock = 2500;
update();
assert.deepEqual(visible(), ['milestone'], 'milestone keeps priority');
clock = 9400;
update();
assert.deepEqual(visible(), ['narration']);
assert(host.classList.contains('wide-notice'), 'long prose opts into the wide phone strip');
game.enemies = [threat];
update();
assert.equal(host.children.length, 0, 'combat immediately hides existing reading');
assert.equal(context.criticalNotices.waiting.length, 1, 'interrupted story is preserved once');
add('warning');
update();
assert.deepEqual(visible(), ['warning'], 'urgent combat warning is never deferred');
clock = 16400;
game.enemies = [];
update();
assert.deepEqual(visible(), ['narration'], 'interrupted story resumes after quiet interval');
assert.equal(context.criticalNotices.waiting.length, 0);
assert.equal(context.criticalNotices.active[0].until, 23200, 'resume grants full reading duration');
game.s.projectiles = [{ x: 10, y: 0, source: 'enemy', life: 1 }];
update();
assert.equal(host.children.length, 0, 'incoming enemy shot hides reading after shooter dies');
game.s.projectiles = [];
clock += 2500;
update();
assert.deepEqual(visible(), ['narration']);
game.s.hazards = [{ x: 0, y: 20, radius: 50, life: 1 }];
update();
assert.equal(host.children.length, 0, 'nearby residual hazard defers reading');
game.s.hazards = [];
clock += 2500;
update();
assert.deepEqual(visible(), ['narration']);
context.menu = {};
update();
assert.equal(host.children.length, 0, 'menu defers optional reading');
context.menu = null;
update();
assert.deepEqual(visible(), ['narration']);
game.enemies = [{ ...threat, x: 2000 }];
update();
assert.deepEqual(visible(), ['narration'], 'distant unrelated combat cannot starve reading');
game.enemies = [{ ...threat, returning: true }];
update();
assert.deepEqual(visible(), ['narration'], 'protected stationary reset cannot starve reading');
game.roamingBoss = () => true;
update();
assert.equal(host.children.length, 0, 'a returning roaming boss remains a real threat');
context.game = { ...game, notices: [], s: { ...game.s }, zone: () => ({ enemies: [] }) };
update();
assert.equal(host.children.length, 0, 'new campaign discards old transient notices');
console.log(
  'PASS real notice queue: combat/quiet interval, interruption, warnings, projectile/hazard safety, full reading time and campaign isolation',
);

// Travel and priority use real emitted context, not synthetic scoped objects.
const Campaign = require('../src/prototype/engine');
const c = new Campaign('developer', 'mage', () => 0.73);
context.game = c;
const quiet = () => {
  c.zone().enemies = [];
  c.s.party = [];
  c.s.projectiles = [];
  c.s.hazards = [];
};
quiet();
c.notices = [];
clock = 30000;
c.notice('Greenwood lore', 6.8, '', 'narration', {
  scope: 'region',
  region: 'vale',
  zone: null,
  visit: null,
});
c.notice('Old local warning', 3, '', 'warning');
c.enter('march');
quiet();
c.notices = c.notices.filter((n) => /Greenwood lore|Old local warning/.test(n.text));
update();
assert.equal(
  host.children.length,
  0,
  'queued old-region lore and local warnings stay off the next map',
);
assert.equal(context.criticalNotices.waiting.length, 1, 'earned regional lore remains available');
c.notice('New region lore', 6.8, '', 'narration', {
  scope: 'region',
  region: 'march',
  zone: null,
  visit: null,
});
update();
assert.equal(
  context.criticalNotices.active[0].text,
  'New region lore',
  'irrelevant older lore cannot block current reading',
);
c.enter('vale');
quiet();
update();
assert.equal(
  context.criticalNotices.active[0].text,
  'Greenwood lore',
  'active and queued lore both obey region travel',
);
c.notice('LEVEL 5', 5.5);
update();
assert.equal(context.criticalNotices.active[0].text, 'LEVEL 5');
c.notice('Companions recalled', 2.8, '', 'feedback');
update();
assert.equal(
  context.criticalNotices.active[0].kind,
  'feedback',
  'routine confirmation promptly interrupts a milestone on phone',
);
c.notice('TRUE boss emerging', 5.5, '', 'warning');
update();
assert.equal(
  context.criticalNotices.active[0].kind,
  'warning',
  'urgent warning preempts routine confirmation',
);
assert.equal(context.criticalNotices.active.length, 1, 'phone displays only one card');
c.enter('march');
quiet();
update();
assert.equal(
  context.criticalNotices.active[0].text,
  'LEVEL 5',
  'global achievement survives travel while local warning expires',
);
assert(
  c.storyReadings().some((n) => n.text === 'Greenwood lore'),
  'full notice remains readable in announcements',
);
// A deferred command receipt must not replay later after a menu or long warning.
context.menu = {};
c.notice('Waiting for a route', 2.8, '', 'feedback');
update();
clock += 5000;
context.menu = null;
update();
assert(
  !context.criticalNotices.waiting.some((n) => n.kind === 'feedback'),
  'stale routine feedback expires',
);
context.platform.mode = 'desktop';
c.notice('BOSS VANQUISHED', 5.5);
clock += 6000;
update();
assert(context.criticalNotices.active.length <= 2, 'desktop retains bounded milestone stacking');
console.log(
  'PASS region/visit isolation, global achievements, phone priorities, stale commands and full-text history',
);
{
  const visit = c.noticeVisit,
    notices = [...c.notices],
    history = [...c.noticeHistory];
  const pay = c.payTravelFare;
  c.payTravelFare = () => {
    throw Error('failed fare transaction fixture');
  };
  assert.equal(c.travel(1), false);
  assert.equal(c.noticeVisit, visit, 'failed travel retains source visit');
  assert.deepEqual(c.notices, notices, 'failed travel retains pending notices');
  assert.deepEqual(c.noticeHistory, history, 'failed travel does not leak destination prose');
  c.payTravelFare = pay;
}
console.log('PASS failed travel retains source notice context');
{
  const saved = new Campaign('normal', 'paladin', () => 0.73),
    line = require('../src/prototype/narration')[3].text;
  saved.s.quests['quest-3'].done = true;
  saved.checkQuests();
  const restored = Campaign.restore(saved.snapshot(), () => 0.73);
  assert.equal(
    restored.storyReadings().filter((n) => n.text === line).length,
    1,
    'earned quest lore survives reload once',
  );
  assert(
    !restored.notices.some((n) => n.text === line),
    'reading history does not replay a paid quest notification',
  );
}
console.log('PASS earned full-text quest history survives reload without announcement replay');

// Real level notices must remain actionable while queued and while displayed.
for (const queued of [true, false]) {
  const leveling = new Campaign('normal', 'mage', () => 0.9);
  leveling.zone().enemies = [];
  leveling.s.party = [];
  context.game = leveling;
  context.platform.mode = 'phone';
  context.menu = queued ? {} : null;
  leveling.xp(leveling.xpRequired());
  update();
  assert.equal(context.criticalNotices[queued ? 'waiting' : 'active'].length, 1);
  assert(leveling.talent(0));
  context.menu = null;
  update();
  assert.equal(context.criticalNotices.active.length, 0, 'spent points hide the visible reminder');
  assert.equal(context.criticalNotices.waiting.length, 0, 'spent points discard queued reminders');
  assert(leveling.freeResetTalents());
  update();
  assert.equal(
    context.criticalNotices.active.length,
    0,
    'refunding points does not replay an old reminder',
  );
}
{
  const leveling = new Campaign('normal', 'paladin', () => 0.9);
  leveling.zone().enemies = [];
  leveling.s.party = [];
  context.game = leveling;
  context.menu = null;
  leveling.xp(leveling.xpRequired(1) + leveling.xpRequired(2));
  update();
  assert(leveling.talent(0));
  update();
  assert.equal(
    context.criticalNotices.active.length,
    1,
    'remaining spendable point keeps reminder useful',
  );
  assert(leveling.talent(0));
  update();
  assert.equal(context.criticalNotices.active.length, 0);
  assert.equal(
    context.criticalNotices.waiting.length,
    0,
    'all queued level reminders clear together',
  );
  leveling.xp(leveling.xpRequired());
  update();
  assert.equal(
    context.criticalNotices.active.length,
    1,
    'a later level produces a fresh valid reminder',
  );
  leveling.hero.talents = leveling.hero.talents.map((_, i) => leveling.talentMaxRank(i));
  update();
  assert.equal(
    context.criticalNotices.active.length,
    0,
    'fully capped talents have no actionable training reminder',
  );
}
console.log(
  'PASS actual talent reminders: queued/visible spending, partial points, multi-level queue, fresh levels, refunds and capped talents',
);
