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
    getBoundingClientRect: () => ({ bottom: 100 }),
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
context.game = { ...game, notices: [], s: { ...game.s }, zone: () => ({ enemies: [] }) };
update();
assert.equal(host.children.length, 0, 'new campaign discards old transient notices');
console.log(
  'PASS real notice queue: combat/quiet interval, interruption, warnings, projectile/hazard safety, full reading time and campaign isolation',
);
