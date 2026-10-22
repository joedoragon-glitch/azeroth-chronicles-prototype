'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm'),
  C = require('../src/prototype/engine');
function shell(language) {
  const elements = new Map(),
    events = {},
    storage = new Map();
  const ctx = new Proxy({}, { get: (o, k) => o[k] || (() => {}) });
  function el() {
    const classes = new Set();
    return {
      firstChild: { textContent: '' },
      dataset: {},
      hidden: false,
      children: [],
      style: {},
      width: 393,
      height: 852,
      textContent: '',
      classList: {
        add: (x) => classes.add(x),
        remove: (x) => classes.delete(x),
        contains: (x) => classes.has(x),
        toggle: (x, v) => (v ? classes.add(x) : classes.delete(x)),
      },
      getContext: () => ctx,
      prepend(...x) {
        this.children.unshift(...x);
      },
      focus() {},
      append(...x) {
        this.children.push(...x);
      },
      replaceChildren(...x) {
        this.children = x;
      },
      setAttribute() {},
      querySelector: () => ({ textContent: '' }),
      scrollIntoView() {},
      click() {
        if (!this.disabled) this.onclick?.();
      },
      getBoundingClientRect: () => ({ left: 12, top: 670, width: 110, height: 110 }),
      setPointerCapture() {},
      addEventListener() {},
    };
  }
  const initial = new C('normal', 'paladin', () => 0.5);
  storage.set('azeroth-v4-normal', JSON.stringify(initial.snapshot()));
  storage.set('azeroth-display-language-v1', language);
  const scope = {
    Campaign: C,
    console,
    performance: { now: () => 0 },
    innerWidth: 393,
    innerHeight: 852,
    Sprint: { enabled: false, press() {}, release() {}, tick: () => 1 },
    localStorage: { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    location: { protocol: 'file:', hostname: '' },
    navigator: {},
    document: {
      documentElement: {},
      hidden: false,
      body: el(),
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, el());
        return elements.get(id);
      },
      createElement: el,
      addEventListener() {},
    },
    addEventListener: (name, fn) => (events[name] ??= []).push(fn),
    requestAnimationFrame() {},
    setTimeout() {},
    Blob,
    URL: { createObjectURL: () => '', revokeObjectURL() {} },
    confirm: () => true,
  };
  for (const [name, file] of Object.entries({
    PrototypeHeroPresentation: 'hero-presentation',
    PrototypeMenus: 'menus',
    PrototypeBuild: 'build-info',
    PrototypeInput: 'input',
    PrototypePersistence: 'persistence',
    PrototypePlatform: 'platform',
    PrototypeRuntime: 'runtime',
    PrototypeRenderer: 'renderer',
    PrototypeCombatVisuals: 'combat-visuals',
    PrototypeAudio: 'audio',
    PrototypeRules: 'rules',
  }))
    scope[name] = require('../src/prototype/' + file);
  scope.PrototypeVisuals = { draw() {}, roads() {}, height: () => 40 };
  scope.window = scope;
  vm.createContext(scope);
  vm.runInContext(fs.readFileSync(require.resolve('../src/prototype/app'), 'utf8'), scope);
  return { scope, elements, storage };
}
for (const language of ['en', 'es']) {
  const { scope: s, elements: e, storage } = shell(language),
    g = s.Prototype.game;
  const npc = g.zone().npcs.find((n) => n.kind === 'recruiter');
  const click = (prefix) => {
    const b = e.get('modal-actions').children.find((b) => b.textContent.startsWith(prefix));
    assert(b, prefix);
    assert(!b.disabled);
    b.click();
  };
  assert(
    e
      .get('objective')
      .textContent.includes(language === 'en' ? 'Meet the town Captain' : 'Habla con el capitán'),
  );
  Object.assign(g.hero, { x: npc.x, y: npc.y });
  e.get('touch-interact-button').click();
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Meet your company' : 'Conoce a tu compañía',
  );
  assert(
    e
      .get('modal-description')
      .textContent.includes(language === 'en' ? 'Expedition Rank 2' : 'rango 2'),
  );
  click(language === 'en' ? 'Practice Recall squad' : 'Probar Reagrupar');
  assert(e.get('modal').hidden);
  assert(g.s.quests['quest-barracks'].recallPracticed);
  assert(JSON.parse(storage.get('azeroth-v4-normal')).quests['quest-barracks'].recallPracticed);
  assert(
    e.get('objective').textContent.includes(language === 'en' ? 'FIELD BASE' : 'BASE DE CAMPO'),
  );
  e.get('touch-interact-button').click();
  assert(e.get('modal-title').textContent.includes('Captain'));
  g.s.expeditionRank = 2;
  g.hero.gold = 0;
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  click(language === 'en' ? 'Recruit Soldier' : 'Reclutar Soldado');
  assert.equal(g.s.recruitmentRequest.type, 'soldier');
  assert(JSON.parse(storage.get('azeroth-v4-normal')).recruitmentRequest);
  assert(
    e
      .get('modal-description')
      .textContent.includes(language === 'en' ? 'Queued recruitment' : 'Reclutamiento en cola'),
  );
  click(language === 'en' ? 'Cancel queued Soldier' : 'Cancelar en cola: Soldado');
  assert.equal(g.s.recruitmentRequest, null);
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).recruitmentRequest, null);

  s.Prototype.closeMenu();
  g.zone().enemies = [];
  g.s.party[0].hp = 0;
  g.s.party[1].hp = 10;
  g.s.party[1].healCd = 999;
  e.get('touch-interact-button').click();
  click(language === 'en' ? 'Recover fallen companion' : 'Recuperar compañero caído');
  assert.equal(
    JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.recovery.companionIds[0],
    g.s.party[0].id,
  );
  click(language === 'en' ? 'Treat wounded companions' : 'Curar compañeros heridos');
  assert(JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.treatment);
  const enemy = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 100, damage: 1, gold: 0, xp: 0 },
    { x: g.hero.x + 80, y: g.hero.y },
  );
  enemy.aggro = true;
  g.zone().enemies = [enemy];
  g.hero.gold = 40;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 40);
  s.Prototype.closeMenu();
  e.get('touch-interact-button').click();
  assert(
    e
      .get('modal-description')
      .textContent.includes(language === 'en' ? 'nearby combat' : 'combate cercano'),
  );
  click(language === 'en' ? 'Cancel queued recovery' : 'Cancelar recuperación en cola');
  click(language === 'en' ? 'Cancel queued treatment' : 'Cancelar tratamiento en cola');
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.recovery, null);
  assert.equal(JSON.parse(storage.get('azeroth-v4-normal')).companionCareRequests.treatment, null);
  enemy.aggro = false;
  s.Prototype.closeMenu();
  const board = g.zone().npcs.find((n) => n.kind === 'quests');
  Object.assign(g.hero, { x: board.x, y: board.y });
  e.get('touch-interact-button').click();
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Quest board' : 'Tablón de misiones',
  );
  assert(!e.get('modal-actions').children.some((b) => b.textContent === 'Story guide'));
  assert(e.get('modal-actions').children.some((b) => b.textContent.includes('Mira')));
  assert(!e.get('modal-actions').children.some((b) => b.textContent.includes('Stolen Stores')));
  click(language === 'en' ? 'Side Quests' : 'Misiones secundarias');
  assert.equal(
    e.get('modal-title').textContent,
    language === 'en' ? 'Side Quests' : 'Misiones secundarias',
  );
  assert(
    e
      .get('modal-actions')
      .children.some((b) =>
        b.textContent.includes(language === 'en' ? 'Stolen Stores' : 'Suministros robados'),
      ),
  );
}
console.log(
  'PASS production English/Spanish captain interaction, staged objective, Recall, queue/cancel menu feedback and immediate action saves',
);
