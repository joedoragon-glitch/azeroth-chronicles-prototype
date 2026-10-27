'use strict';
// Multi-class/mode persistence is preview-opt-in and never clobbers legacy v4.
const assert = require('node:assert/strict');
const P = require('../src/prototype/persistence.js');
const Campaign = require('../src/prototype/engine.js');
const { shell } = require('./helpers/production-shell.cjs');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.enableRoguePlaytest();
try {
  const bytes = new Map();
  const writes = [];
  const storage = {
    getItem: (key) => bytes.get(key) ?? null,
    setItem(key, value) { writes.push(key); bytes.set(key, String(value)); },
    removeItem(key) { bytes.delete(key); },
  };
  const legacy = new Campaign('normal', 'paladin', () => 0.9);
  legacy.hero.gold = 333;
  const original = JSON.stringify(legacy.snapshot());
  bytes.set(P.saveKey('normal'), original);
  const modes = ['normal', 'nightmare', 'developer', 'arena'];
  const slots = P.createClassSlots({ storage, Campaign, now: () => 1700000000000 });
  assert.equal(slots.load('normal', 'paladin').hero.gold, 333,
    'old save remains directly readable under its original class');
  assert.equal(slots.exists('normal', 'paladin'), true);
  assert.equal(slots.exists('normal', 'rogue'), false);
  assert.equal(slots.load('normal', 'rogue'), null);
  assert.equal(slots.listSaves(['normal']).length, 1);
  assert.equal(slots.listSaves(['normal'])[0].source, 'legacy');

  for (const cls of ['rogue', 'mage', 'ranger', 'paladin']) {
    const g = new Campaign('normal', cls, () => 0.9);
    g.hero.gold = { rogue: 101, mage: 202, ranger: 303, paladin: 404 }[cls];
    assert.equal(slots.save(g, { activeClass: cls, activeMode: 'normal' }), true);
    assert.equal(slots.load('normal', cls).hero.gold, g.hero.gold);
    assert.equal(slots.load('normal', cls).hero.class, cls);
    assert.equal(bytes.get(P.saveKey('normal')), original,
      'the old per-mode primary is never modified by class-specific writes');
    assert.doesNotThrow(() =>
      Campaign.validate(JSON.parse(bytes.get(slots.saveKey('normal', cls)))));
  }
  assert.equal(slots.listSaves(['normal']).length, 4);
  assert.deepEqual(slots.listSaves(['normal']).map(x => x.source),
    ['class', 'class', 'class', 'class']);
  // Saved authoring profile is class selection only, never critical-intensity.
  assert.equal(slots.loadProfile({ activeMode: 'normal', activeClass: 'paladin' }).activeClass,
    'paladin');
  assert.equal(JSON.stringify(slots.load('normal', 'rogue').snapshot()).includes('rogueCriticalLevels'), false);

  for (const mode of modes.slice(1)) {
    const game = new Campaign(mode, 'rogue', () => 0.9);
    game.hero.gold = mode === 'nightmare' ? 900 : mode === 'developer' ? 800 : 700;
    assert.equal(slots.save(game, { activeMode: 'normal', activeClass: 'rogue' }), true);
    assert.equal(slots.load(mode, 'rogue').hero.gold, game.hero.gold);
    assert.equal(slots.load('normal', 'rogue').hero.gold, 101,
      'other modes never overwrite normal Rogue');
  }
  assert.equal(slots.loadPreferred('normal', 'rogue').hero.class, 'rogue');
  assert.equal(slots.loadPreferred('normal', 'not-a-class').hero.class, 'paladin');

  // Class checkpoints and malformed originals are strictly owned per slot.
  const rogueKey = slots.saveKey('normal', 'rogue');
  const paladinKey = slots.saveKey('normal', 'paladin');
  const paladinBefore = bytes.get(paladinKey);
  const priorRogue = bytes.get(rogueKey);
  const corrupt = '{broken';
  bytes.set(rogueKey, corrupt);
  const broken = P.createClassSlots({ storage, Campaign });
  assert.equal(broken.load('normal', 'rogue'), null);
  assert.equal(broken.load('normal', 'paladin').hero.gold, 404);
  assert.equal(broken.save(new Campaign('normal', 'rogue'), {}), false,
    'normal autosave cannot silently overwrite a broken class slot');
  assert.equal(bytes.get(rogueKey), corrupt);
  const recoverySlots = broken.recoveryOptions('normal', 'rogue');
  assert(recoverySlots.length > 0, 'prior validated Rogue save can be recovered');
  assert(recoverySlots.every(x => x.heroClass === 'rogue'));
  const repaired = broken.recover('normal', recoverySlots[0].id, 'rogue');
  assert.equal(repaired.hero.class, 'rogue');
  assert.equal(bytes.get(paladinKey), paladinBefore);
  assert.equal(bytes.get(P.saveKey('normal')), original);
  assert.equal(bytes.get(rogueKey).includes('{broken'), false);

  // Foreign/mislabeled snapshots are not accepted as this class.
  bytes.set(rogueKey, bytes.get(paladinKey));
  const forged = P.createClassSlots({ storage, Campaign });
  assert.equal(forged.load('normal', 'rogue'), null);
  assert.equal(forged.save(new Campaign('normal', 'rogue'), {}), false);
  assert.equal(bytes.get(rogueKey), paladinBefore);
  assert.equal(forged.load('normal', 'paladin').hero.gold, 404);

  // The older public adapter and save key must remain unchanged.
  const standard = P.create({ storage, Campaign });
  assert.equal(standard.load('normal').hero.gold, 333);
  assert.equal(P.saveKey('normal'), 'azeroth-v4-normal');
  const guard = P.createRestartGuard({ storage, Campaign, classSlots: true });
  assert(guard.arm(slots.load('normal', 'paladin')));
  assert.equal(guard.read().heroClass, 'paladin');
  assert(guard.clean());

  // Real shell: class-matched legacy save is retained and Rogue preview gate
  // switches to class-specific slots, without modifying the original.
  const liveStorage = new Map([[P.saveKey('normal'), original]]);
  const app = shell('en', 'paladin', {
    storage: liveStorage, stayOnTitle: true,
    location: { protocol: 'file:', hostname: '', search: '?roguePlaytest=1' },
  });
  assert.equal(app.scope.Prototype.game.hero.class, 'paladin');
  assert.equal(app.scope.Prototype.game.hero.gold, 333);
  assert.equal(liveStorage.get(P.saveKey('normal')), original);
  assert.equal(app.scope.Campaign.classes.rogue.icon, '🔔');
  console.log('PASS separate 4-class x 4-mode saves, legacy v4 read-only, recovery identity, class corruption, browser opt-in and no public migration');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
  delete R.movementBasicClasses.rogue;
}
