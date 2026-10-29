'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const P = require('../src/prototype/persistence');
const { shell } = require('./helpers/production-shell.cjs');
function fixture(mode = 'normal') {
  const values = new Map(),
    writes = [];
  let clock = 1700000000000;
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      writes.push(key);
      values.set(key, String(value));
    },
  };
  const p = P.create({ storage, Campaign: C, now: () => clock });
  const g = new C(mode, 'mage', () => 0.5);
  assert(p.save(g, {}));
  return {
    values,
    writes,
    storage,
    p,
    g,
    advance: (ms = 60000) => {
      clock += ms;
    },
    bundle: () => JSON.parse(values.get(P.checkpointKey(mode))),
  };
}
for (const mode of ['normal', 'nightmare']) {
  const f = fixture(mode);
  for (let i = 1; i <= 6; i++) {
    f.advance();
    f.g.hero.gold = i;
    f.g.s.time += 60;
    assert(f.p.save(f.g, {}));
  }
  assert.deepEqual(
    f.bundle().entries.map((e) => JSON.parse(e.bytes).hero.gold),
    [5],
    'Only the most recent preceding durable checkpoint remains',
  );
  assert(f.values.get(P.checkpointKey(mode)).length <= P.checkpointMaxChars);
  const backupWrites = f.writes.filter((key) => key === P.checkpointKey(mode)).length;
  f.advance(5000);
  f.g.hero.gold = 7;
  assert(f.p.save(f.g, {}));
  assert.equal(
    f.writes.filter((key) => key === P.checkpointKey(mode)).length,
    backupWrites,
    'Five-second autosaving does not rotate full checkpoint bundles',
  );
  const reboot = P.create({ storage: f.storage, Campaign: C, now: () => 1700000365000 });
  assert(reboot.load(mode));
  assert.equal(
    f.writes.filter((key) => key === P.checkpointKey(mode)).length,
    backupWrites,
    'Restart respects the persisted checkpoint interval',
  );

  const broken = '{interrupted JSON';
  f.values.set(P.saveKey(mode), broken);
  const recovery = P.create({ storage: f.storage, Campaign: C });
  assert.equal(recovery.load(mode), null);
  const before = f.writes.length;
  const options = recovery.recoveryOptions(mode);
  assert.equal(options.length, 1);
  assert.equal(f.writes.length, before, 'Inspection never replaces any data');
  assert.equal(f.values.get(P.saveKey(mode)), broken);
  assert.throws(() => recovery.recover(mode, 'unknown'));
  options[0].level = 999; // Preview labels cannot mutate the private recovery bytes.
  const restored = recovery.recover(mode, options[0].id);
  assert.equal(restored.hero.gold, 5);
  assert.equal(restored.hero.level, 1);
  assert.equal(restored.hero.class, 'mage');
  assert(C.restore(JSON.parse(f.values.get(P.saveKey(mode)))));
  assert.equal(f.values.get(P.saveKey(mode) + '-unreadable-backup'), broken);
  assert.throws(() => recovery.recover(mode, options[0].id), /expired/);
}
// Invalid, incompatible and other-mode entries are skipped, not repaired by guessing.
{
  const f = fixture();
  const valid = f.bundle().entries[0];
  f.values.set(
    P.checkpointKey('normal'),
    JSON.stringify({
      version: 1,
      entries: [
        { savedAt: valid.savedAt, bytes: '{bad' },
        { savedAt: valid.savedAt, bytes: JSON.stringify(new C('nightmare').snapshot()) },
        valid,
      ],
    }),
  );
  f.values.delete(P.saveKey('normal'));
  const p = P.create({ storage: f.storage, Campaign: C });
  assert.equal(p.load('normal'), null);
  assert(p.loadFailed('normal'), 'A missing primary with recovery data opens recovery');
  const options = p.recoveryOptions('normal');
  assert.equal(options.length, 1);
  assert(p.recover('normal', options[0].id));
}
// Device-clock rollback must not suspend the checkpoint cadence indefinitely.
{
  const f = fixture();
  f.advance(-1000);
  f.g.hero.gold = 1;
  assert(f.p.save(f.g, {}));
  f.g.hero.gold = 2;
  assert(f.p.save(f.g, {}));
  assert.equal(
    f.bundle().entries[0].savedAt,
    1699999999000,
    'A backwards device clock does not freeze future checkpoint rotation',
  );
}
// Routine backup work reuses already validated primaries instead of rebuilding worlds.
{
  const values = new Map();
  let clock = 1700000000000,
    restores = 0;
  const p = P.create({
    storage: { getItem: (key) => values.get(key), setItem: (key, bytes) => values.set(key, bytes) },
    now: () => clock,
    Campaign: {
      validate: C.validate,
      migrate: C.migrate,
      restore(...args) {
        restores++;
        return C.restore(...args);
      },
    },
  });
  const g = new C();
  assert(p.save(g, {}));
  for (let i = 1; i <= 5; i++) {
    clock += 60000;
    g.hero.gold = i;
    assert(p.save(g, {}));
  }
  assert.equal(restores, 0, 'Ordinary validated autosaves never restore another Campaign');
  assert.equal(p.recoveryOptions('normal').length, 1);
  assert.equal(restores, 1, 'Candidate worlds are built only for explicit bounded inspection');
}
// An existing, documented v2 migration can rescue a misplaced old-format primary.
{
  const values = new Map([
    [P.saveKey('normal'), JSON.stringify({ version: 2, player: { heroClass: 'mage', gold: 246 } })],
  ]);
  const storage = { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) };
  const p = P.create({ storage, Campaign: C });
  assert.equal(p.load('normal'), null);
  const option = p.recoveryOptions('normal')[0];
  assert.equal(option.source, 'compatible');
  assert.equal(p.recover('normal', option.id).hero.gold, 246);
  assert.equal(JSON.parse(values.get(P.saveKey('normal'))).version, 4);
  assert.equal(JSON.parse(values.get(P.saveKey('normal') + '-unreadable-backup')).version, 2);
}
// Stale previews, non-owners and interrupted writes retain the original primary.
for (const failure of ['stale', 'nonowner', 'archive-quota', 'primary-quota']) {
  const f = fixture();
  f.values.set(P.saveKey('normal'), '{broken');
  let owner = true;
  const storage = {
    getItem: f.storage.getItem,
    setItem(key, value) {
      if (failure === 'archive-quota' && key.endsWith('-unreadable-backup')) throw Error('quota');
      if (failure === 'primary-quota' && key === P.saveKey('normal')) throw Error('quota');
      f.storage.setItem(key, value);
    },
  };
  const p = P.create({ storage, Campaign: C, canWrite: () => owner });
  p.load('normal');
  const option = p.recoveryOptions('normal')[0];
  if (failure === 'stale') f.values.set(P.saveKey('normal'), '{newer');
  if (failure === 'nonowner') owner = false;
  const original = f.values.get(P.saveKey('normal'));
  assert.throws(() => p.recover('normal', option.id));
  assert.equal(f.values.get(P.saveKey('normal')), original, failure);
}
// Optional backup quota failures never turn a successful primary write into data loss.
{
  const f = fixture();
  for (let i = 1; i <= 3; i++) {
    f.advance();
    f.g.hero.gold = i;
    assert(f.p.save(f.g, {}));
  }
  let limit = Infinity;
  const storage = {
    getItem: f.storage.getItem,
    setItem(key, bytes) {
      if (key === P.checkpointKey('normal') && bytes.length > limit) throw Error('quota');
      f.storage.setItem(key, bytes);
    },
  };
  const p = P.create({ storage, Campaign: C, now: () => 1700000180000 });
  const g = p.load('normal');
  limit = JSON.stringify({ version: 1, entries: [f.bundle().entries[0]] }).length + 100;
  g.hero.gold = 42;
  assert(p.writeCandidate(g));
  assert.equal(f.bundle().entries.length, 1, 'Quota pressure trims older entries first');
  limit = 0;
  g.hero.gold = 43;
  assert(p.writeCandidate(g), 'An unavailable optional backup cannot prevent saving');
  assert.equal(JSON.parse(f.values.get(P.saveKey('normal'))).hero.gold, 43);
  assert.equal(f.bundle().entries.length, 1, 'Failed bundle replacement preserves its old bytes');
}
// When the single checkpoint blocks the primary, reclaim it and retry once.
{
  const f = fixture();
  for (let i = 1; i <= 3; i++) {
    f.advance();
    f.g.hero.gold = i;
    assert(f.p.save(f.g, {}));
  }
  const primary = P.saveKey('normal'),
    checkpoint = P.checkpointKey('normal'),
    statuses = [];
  let failures = 0;
  const storage = {
    getItem: f.storage.getItem,
    removeItem(key) {
      f.values.delete(key);
    },
    setItem(key, value) {
      if (key === primary && f.values.has(checkpoint)) {
        failures++;
        throw Error('quota');
      }
      // A device may still lack space to recreate the optional checkpoint.
      if (key === checkpoint && !f.values.has(checkpoint)) throw Error('quota');
      f.storage.setItem(key, value);
    },
  };
  const p = P.create({ storage, Campaign: C, status: (message) => statuses.push(message) });
  f.g.hero.gold = 987;
  assert(p.save(f.g, {}));
  assert.equal(failures, 1, 'Exactly one primary write retry');
  assert.equal(f.values.has(checkpoint), false);
  assert.equal(JSON.parse(f.values.get(primary)).hero.gold, 987);
  assert.match(statuses.at(-1), /recovery checkpoint could not be stored/);
}
// A genuinely failed primary write does not replace the previous primary.
{
  const f = fixture(),
    primary = P.saveKey('normal'),
    original = f.values.get(P.saveKey('normal'));
  const p = P.create({
    storage: {
      getItem: f.storage.getItem,
      removeItem(key) {
        f.values.delete(key);
      },
      setItem(key, value) {
        if (key === primary) throw Error('quota');
        f.storage.setItem(key, value);
      },
    },
    Campaign: C,
  });
  f.g.hero.gold = 999;
  assert.equal(p.save(f.g, {}), false);
  assert.equal(f.values.get(primary), original);
}
// Unrelated storage faults must not cause backup deletion.
{
  const f = fixture(),
    primary = P.saveKey('normal'),
    checkpoint = P.checkpointKey('normal'),
    before = f.values.get(P.checkpointKey('normal'));
  const p = P.create({
    storage: {
      getItem: f.storage.getItem,
      removeItem(key) {
        f.values.delete(key);
      },
      setItem(key, value) {
        if (key === primary) throw Error('storage disabled');
        f.storage.setItem(key, value);
      },
    },
    Campaign: C,
  });
  f.g.hero.gold = 999;
  assert.equal(p.save(f.g, {}), false);
  assert.equal(f.values.get(checkpoint), before);
}
// Recovery for one mode cannot consume or replace the other mode's history.
{
  const f = fixture('normal');
  const nightmare = new C('nightmare');
  nightmare.hero.gold = 555;
  assert(f.p.save(nightmare, {}));
  const normal = f.values.get(P.saveKey('normal'));
  const normalCheckpoints = f.values.get(P.checkpointKey('normal'));
  f.values.set(P.saveKey('nightmare'), '{broken');
  const p = P.create({ storage: f.storage, Campaign: C });
  p.load('nightmare');
  const option = p.recoveryOptions('nightmare')[0];
  assert.equal(p.recover('nightmare', option.id).hero.gold, 555);
  assert.equal(f.values.get(P.saveKey('normal')), normal);
  assert.equal(f.values.get(P.checkpointKey('normal')), normalCheckpoints);
  const backup = f.values.get(P.checkpointKey('normal'));
  f.g.hero.cd[0] = Infinity;
  assert.equal(f.p.save(f.g, {}), false);
  assert.equal(
    f.values.get(P.checkpointKey('normal')),
    backup,
    'Invalid live state never enters history',
  );
}
// A late-game campaign sized like the reported save can still be checkpointed.
{
  const f = fixture();
  f.g.s.extra = 'x'.repeat(1000000);
  f.advance();
  assert(f.p.save(f.g, {}));
  f.g.hero.gold = 71;
  f.advance();
  assert(f.p.save(f.g, {}));
  const bundle = f.bundle();
  assert.equal(P.checkpointLimit, 1);
  assert.equal(P.checkpointMaxChars, 2000000);
  assert.equal(bundle.entries.length, 1);
  assert(bundle.entries[0].bytes.length > 500000);
  assert(f.values.get(P.checkpointKey('normal')).length <= P.checkpointMaxChars);
  assert.equal(JSON.parse(bundle.entries[0].bytes).hero.gold, 0);
}
// A schema-valid oversized envelope stays savable while backup size remains bounded.
{
  const f = fixture();
  f.g.s.extra = 'x'.repeat(P.checkpointMaxChars);
  assert(f.p.save(f.g, {}));
  assert(f.values.get(P.saveKey('normal')).length > P.checkpointMaxChars);
  assert(f.values.get(P.checkpointKey('normal')).length <= P.checkpointMaxChars);
}
for (const language of ['en', 'es']) {
  const f = fixture();
  f.values.set(P.saveKey('normal'), '{broken');
  const app = shell(language, 'paladin', { storage: f.values });
  const title = () => app.elements.get('modal-title').textContent;
  const click = (label) => {
    const button = app.elements
      .get('modal-actions')
      .children.find((b) => b.textContent.startsWith(label));
    assert(button && !button.disabled, label + ' missing from ' + title());
    button.click();
  };
  assert.equal(app.elements.get('title-continue').disabled, true);
  app.elements.get('title-saves').click();
  click(language === 'es' ? 'Intentar recuperar' : 'Try recovery');
  click(language === 'es' ? 'Intentar recuperar' : 'Try recovery');
  click(language === 'es' ? 'Punto de recuperación' : 'Checkpoint');
  assert.equal(title(), language === 'es' ? 'Revisar recuperación' : 'Review recovery');
  assert(
    app.elements
      .get('modal-description')
      .textContent.includes(language === 'es' ? 'Nivel 1' : 'Level 1'),
  );
  assert.equal(f.values.get(P.saveKey('normal')), '{broken', 'Preview is non-destructive');
  app.elements.get('close-button').click(); // Cancel preview; list is regenerated.
  assert.equal(f.values.get(P.saveKey('normal')), '{broken');
  click(language === 'es' ? 'Punto de recuperación' : 'Checkpoint');
  click(language === 'es' ? 'Recuperar esta partida' : 'Recover this run');
  assert.equal(app.scope.Prototype.game.hero.class, 'mage');
  assert(app.elements.get('modal').hidden, 'Accepted recovery resumes the real game shell');
  assert.equal(f.values.get(P.saveKey('normal') + '-unreadable-backup'), '{broken');
  assert.equal(app.scope.Prototype.save(), false, 'title remains inactive after recovery');
  app.elements.get('title-continue').click();
  app.frame(0);
  assert(app.scope.Prototype.save(), 'Continue allows guarded saving after recovery');
}
// A genuinely missing primary has a recovery entry point and no empty original export.
{
  const f = fixture();
  f.values.delete(P.saveKey('normal'));
  const app = shell('en', 'mage', { storage: f.values, seedSave: false });
  app.elements.get('title-saves').click();
  app.elements.get('modal-actions').children.find((b) => b.textContent === 'Try recovery').click();
  assert.equal(app.elements.get('modal-title').textContent, 'Saved run could not be opened');
  assert(
    app.elements.get('modal-actions').children.find((b) => b.textContent === 'Export original save')
      .disabled,
  );
}
// A new run/import can target an unreadable slot that was never selected at startup.
{
  const original = '{unselected broken save';
  const values = new Map([[P.saveKey('normal'), original]]);
  const p = P.create({
    Campaign: C,
    storage: {
      getItem: (key) => values.get(key),
      setItem: (key, value) => values.set(key, value),
    },
  });
  assert.equal(p.save(new C(), {}), false);
  assert.equal(values.get(P.saveKey('normal')), original);
  assert(p.writeCandidate(new C()));
  assert.equal(values.get(P.saveKey('normal') + '-unreadable-backup'), original);
}
console.log(
  'PASS bounded rotation, throttling, mode isolation, validated migration/recovery, quota and stale-write safety, bilingual preview/cancel/accept',
);
