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

  // A broken pre-class primary is still recoverable using its original,
  // intact mode-only checkpoints; no inferred class is written on inspection.
  {
    const old = new Map([
      [P.saveKey('normal'), '{damaged legacy'],
      [P.checkpointKey('normal'), JSON.stringify({
        version: 1,
        entries: [{ savedAt: 1700000000000,
          bytes: JSON.stringify(new Campaign('normal', 'rogue').snapshot()) }],
      })],
    ]);
    const historic = P.createClassSlots({ storage: {
      getItem: key => old.get(key) ?? null,
      setItem: (key, value) => old.set(key, String(value)),
    }, Campaign });
    const recoverable = historic.recoveryOptions('normal', 'rogue');
    assert.equal(recoverable.length, 1);
    assert.equal(old.get(P.saveKey('normal')), '{damaged legacy');
    assert.equal(historic.recover('normal', recoverable[0].id, 'rogue').hero.class,
      'rogue');
    assert.equal(old.get(P.saveKey('normal') + '-unreadable-backup'),
      '{damaged legacy');
    assert.equal(JSON.parse(old.get(P.saveKey('normal'))).hero.class, 'rogue');
  }

  // Real title menu exposes independently selectable saved classes.
  {
    const browserStorage = new Map([
      [P.saveKey('normal'), original],
      [slots.saveKey('normal', 'mage'), bytes.get(slots.saveKey('normal', 'mage'))],
    ]);
    const browser = shell('en', 'paladin', {
      storage: browserStorage, stayOnTitle: true,
      location: { protocol: 'file:', hostname: '', search: '?roguePlaytest=1' },
    });
    browser.elements.get('title-saves').click();
    const options = browser.elements.get('modal-actions').children;
    const mageButton = options.find(button =>
      button.textContent.startsWith('Normal · Mage'));
    const paladinButton = options.find(button =>
      button.textContent.startsWith('Normal · Paladin'));
    assert(mageButton && paladinButton,
      'independently listed legacy Paladin and modern Mage in real UI');
    mageButton.click();
    assert.equal(browser.scope.Prototype.game.hero.class, 'mage');
    assert.equal(browserStorage.get(P.saveKey('normal')), original);
  }

  // Follow the real title -> mode -> language -> challenge -> Rogue Bard
  // class-selection UI, not only an injected headless constructor.
  {
    const uiStorage = new Map([[P.saveKey('normal'), original]]);
    const ui = shell('en', 'paladin', {
      storage: uiStorage, stayOnTitle: true,
      location: { protocol: 'file:', hostname: '', search: '?roguePlaytest=1' },
    });
    const click = (prefix) => {
      const actions = ui.elements.get('modal-actions').children;
      const button = actions.find((item) => item.textContent.startsWith(prefix));
      assert(button && !button.disabled, 'missing action ' + prefix);
      button.click();
    };
    ui.elements.get('title-new').click();
    click('New Normal game');
    click('English');
    click('Standard death and refuge recovery');
    assert(ui.elements.get('modal-actions').children.some((b) =>
      b.textContent.includes('Rogue Bard')), 'Rogue Bard appears in live class selection');
    click('🔔 Rogue Bard');
    assert.equal(ui.scope.Prototype.game.hero.class, 'rogue');
    assert.equal(JSON.parse(uiStorage.get(slots.saveKey('normal', 'rogue'))).hero.class, 'rogue');
    assert.equal(uiStorage.get(P.saveKey('normal')), original,
      'a new real Rogue campaign does not replace the legacy Paladin save');
  }

  // Succession must never reroute the same campaign to its successor's
  // independent class slot. The founding class identifies the SAVE, while
  // hero.class identifies the current playable successor inside that save.
  {
    const rows = new Map();
    const io = {
      getItem: (key) => rows.get(key) ?? null,
      setItem: (key, value) => rows.set(key, String(value)),
    };
    const saveSlots = P.createClassSlots({ storage: io, Campaign });
    const other = new Campaign('normal', 'mage', () => 0.9);
    other.hero.gold = 818;
    saveSlots.writeCandidate(other);
    const mageKey = saveSlots.saveKey('normal', 'mage');
    const unrelated = rows.get(mageKey);
    const campaign = new Campaign('normal', 'rogue', () => 0.9,
      { succession: true });
    saveSlots.writeCandidate(campaign);
    assert.equal(saveSlots.slotClass(campaign), 'rogue');
    campaign.s.challenge.fallen.push('rogue');
    campaign.s.challenge.pending = true;
    campaign.hero.hp = 0;
    assert.equal(campaign.successor('mage'), true);
    assert.equal(campaign.hero.class, 'mage');
    assert.equal(saveSlots.slotClass(campaign), 'rogue',
      'owner does not become the new hero class');
    assert.equal(saveSlots.save(campaign, { activeClass: 'rogue' }), true);
    const rogueKey = saveSlots.saveKey('normal', 'rogue');
    assert.equal(JSON.parse(rows.get(rogueKey)).hero.class, 'mage');
    assert.equal(rows.get(mageKey), unrelated,
      'other Mage run has not been overwritten by Rogue Succession');
    const restored = P.createClassSlots({ storage: io, Campaign });
    const resumed = restored.load('normal', 'rogue');
    assert.equal(resumed.hero.class, 'mage');
    assert.equal(restored.slotClass(resumed), 'rogue');
    resumed.hero.gold += 1;
    assert(restored.save(resumed, { activeClass: 'rogue' }));
    assert.equal(rows.get(mageKey), unrelated);
    assert.equal(JSON.parse(rows.get(rogueKey)).hero.gold, resumed.hero.gold);
    const guard = P.createRestartGuard({
      storage: io, Campaign, classSlots: true,
      slotClass: (game) => restored.slotClass(game),
    });
    assert(guard.arm(resumed), 'restart marker reads founding class slot');
    assert.equal(guard.read().heroClass, 'mage');
  }

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
