'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  { createCanvas } = require('@napi-rs/canvas');
const C = require('../../../src/prototype/engine.js'),
  Input = require('../../../src/prototype/input.js'),
  Menus = require('../../../src/prototype/menus.js'),
  fixture = require('./dev137-save.json');
const report = { quests: [], maps: [], ferry: [], distribution: null };
function harness(g) {
  let menu, canvas;
  const elements = {
    modal: { setAttribute() {} },
    'modal-actions': { children: [] },
    'modal-description': {
      append(c) {
        canvas = c;
      },
    },
  };
  const action = (label, run, detail, disabled) => ({ label, run, detail, disabled });
  const openMenu = (title, description, actions, back) => {
    menu = { title, description, actions, back };
    elements['modal-actions'].children = actions.map((a) => ({
      disabled: a.disabled,
      textContent: a.label,
      classList: { add() {}, toggle() {} },
    }));
  };
  const ctx = {
    game: g,
    Campaign: C,
    D: C.data,
    action,
    openMenu,
    closeMenu: () => {},
    $: (id) => elements[id],
    document: {
      createElement: () => {
        const c = createCanvas(480, 320);
        c.setAttribute = () => {};
        return c;
      },
    },
    PrototypeInput: Input,
    status: () => {},
    highlight: () => {},
    questGuide: null,
    storyRouteActive: false,
  };
  const app = fs.readFileSync(path.join(__dirname, '../../../src/prototype/app.js'), 'utf8');
  const start = app.indexOf('  function showMap('),
    end = app.indexOf("  $('squad-button').onclick", start);
  vm.runInNewContext(app.slice(start, end) + ';showMap();', ctx);
  return {
    ctx,
    menu: () => menu,
    canvas: () => canvas,
    elements,
    api: Menus.create({
      getGame: () => g,
      Campaign: C,
      D: C.data,
      action,
      openMenu,
      closeMenu: () => {},
    }),
  };
}
for (const mode of ['fresh', 'dev137']) {
  const g = mode === 'fresh' ? new C('developer', 'paladin', () => 0.37) : C.restore(fixture);
  g.s.zone = 'highlands';
  const z = g.zone();
  Object.assign(g.hero, C.rules.harbors.highlands.arrival);
  const defs = g.questDefs().filter((q) => q.region === 'highlands');
  assert.equal(defs.length, 6);
  // Exercise the real current destination resolver, including multiple-step site objectives.
  for (const q of defs) {
    const saved = structuredClone(g.s),
      results = [];
    g.s.quests[q.id] = { active: true, count: 0, done: false, paid: false };
    if (q.target === 'ridge') {
      delete g.s.rescued.ridge;
      delete g.s.normal.ridge;
    }
    if (q.target === 'mine') {
      delete g.s.rescued.mine;
      delete g.s.normal.mine;
    }
    const target = g.questDestination(q.id);
    assert(target, 'quest ' + q.name);
    assert(g.navigationTarget(target), 'navigation ' + q.name);
    results.push({ id: target.id, x: target.x, y: target.y, kind: target.kind || target.type });
    if (q.kind === 'rescue' && q.target === 'ridge')
      assert.equal(
        target,
        g.zone().enemies.find((e) => e.family === 'ridge' && e.type === 'boss'),
      );
    if (q.kind === 'rescue' && q.target === 'mine') assert.equal(target.family, 'mine');
    if (q.kind === 'bundles') assert.equal(target.family, 'supply-highlands');
    if (q.kind === 'sites')
      for (const id of q.sites) {
        const p =
          id === 'port'
            ? { id, x: C.data.ports[2][0], y: C.data.ports[2][1] }
            : z.npcs.find((n) => n.id === id);
        assert(p, 'site ' + id);
        assert(g.navigationTarget(p), 'site route ' + id);
        results.push({ id, x: p.x, y: p.y });
      }
    report.quests.push({ mode, name: q.name, targets: results });
    g.s = saved;
  }
  const h = harness(g),
    destinations = g.mapDestinations();
  assert(!destinations.some((n) => n.id.startsWith('highlands-tribute-site-')));
  for (const p of destinations) {
    assert(g.navigationTarget(p), 'map route ' + p.id);
    const real =
      g.zone().npcs.find((n) => n.id === p.id) || g.zone().enemies.find((n) => n.id === p.id);
    if (real) assert.deepEqual([p.x, p.y], [real.x, real.y]);
  }
  const keep = destinations.find((n) => n.id === 'lookout'),
    index = destinations.indexOf(keep);
  h.menu().actions[index + 1].run();
  const go = h.elements['modal-actions'].children[0];
  assert(!go.disabled);
  assert(go.textContent.includes('Old Signal Keep'));
  h.menu().actions[0].run();
  assert(g.hero.order, 'real menu Navigate starts movement');
  fs.writeFileSync(
    path.join(__dirname, 'navigation-map-' + mode + '.png'),
    h.canvas().toBuffer('image/png'),
  );
  report.maps.push({
    mode,
    destinations: destinations.length,
    selected: 'Old Signal Keep',
    navigateStartsMovement: true,
    hiddenStoresNotExposed: true,
    terrainSource: 'current game.blocked terrain grid, current roads and actual live destinations',
  });
  if (mode === 'fresh') {
    const edge = (p) => p.x < 850 || p.x > 2550 || p.y < 850 || p.y > 2550,
      objects = (p) => !p.highlandsNature && !p.decorative;
    report.distribution = {
      before: {
        total: fixture.zones.highlands.props.length,
        edgeProps: fixture.zones.highlands.props.filter(edge).length,
      },
      after: { total: z.props.length, edgeProps: z.props.filter(edge).length },
      natureSpecies: [
        ...new Set(z.props.filter((p) => p.highlandsNature === 'tree').map((p) => p.treeSpecies)),
      ].sort(),
      sourceNote:
        'Outer quarter-width band; counts describe props only, not a blanket quality score.',
    };
  }
}
for (const mode of ['developer', 'normal', 'dev137']) {
  const g = mode === 'dev137' ? C.restore(fixture) : new C(mode, 'paladin', () => 0.37);
  g.s.zone = 'march';
  g.s.clock = 200;
  g.zone();
  g.hero.gold = 4321;
  g.hero.hp = g.hero.maxHp;
  const supply = g.s.party[0];
  supply.carry = 7.5;
  const before = g.hero.gold,
    fare = g.travelFare(1, 1);
  assert(g.travel(1));
  assert.equal(g.zoneId, 'highlands');
  assert(!g.blocked(g.hero.x, g.hero.y));
  assert(Math.hypot(g.hero.x - 425, g.hero.y - 1900) < 5);
  assert.equal(supply.carry, 7.5);
  assert(
    g.route(
      g.hero,
      g.zone().npcs.find((n) => n.id === 'rest'),
    ).length,
  );
  const boat = g.zone().npcs.find((n) => n.id === 'return'),
    boarding = g.navigationTarget(boat);
  assert(boarding && Math.hypot(boarding.point.x - boat.x, boarding.point.y - boat.y) < 115);
  if (g.s.mode !== 'developer') {
    assert(g.s.tickets.march);
    assert.equal(g.hero.gold, before - fare);
  }
  const h = harness(g);
  h.api.transport(boat);
  assert(h.menu().description.includes('sheltered coastal channel'));
  assert(h.menu().description.includes('Stonecross'));
  assert(g.travel(-1));
  assert.equal(g.zoneId, 'march');
  assert(!g.blocked(g.hero.x, g.hero.y));
  assert(Math.hypot(g.hero.x - 1770, g.hero.y - 2770) < 5);
  assert.equal(g.s.party[0].carry, 7.5);
  report.ferry.push({
    mode,
    roundTrip: true,
    ticketsAndFare: true,
    cargoRetained: true,
    clearArrivals: true,
    boardingFromLand: true,
    routeCopy: true,
  });
}
fs.writeFileSync(
  path.join(__dirname, 'geography-quest-map-audit.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  'PASS six quests in fresh/dev137 saves, actual Map & Navigation selection/routes, and three ferry round trips',
);
