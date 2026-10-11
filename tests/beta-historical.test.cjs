'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const C = require('../src/prototype/engine.js');
const manifest = require('../docs/evidence/beta-v09/historical.json');
for (const row of manifest.rows.filter((r) => r.fixture)) {
  const bytes = zlib.gunzipSync(
    fs.readFileSync(path.join(__dirname, 'fixtures/beta-history', row.fixture)),
  );
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), row.originalSha256);
  const original = JSON.parse(bytes),
    copy = JSON.stringify(original);
  const c = C.restore(original, () => 0.9);
  assert.equal(JSON.stringify(original), copy, 'original old-engine export remains unchanged');
  assert.equal(c.hero.class, original.hero.class);
  assert.equal(c.s.mode, original.mode);
  assert.equal(c.hero.gold, original.hero.gold);
  assert.equal(c.hero.weapon, 4);
  assert.equal(c.hero.armorTier, 4);
  assert.deepEqual(c.hero.reforges, original.hero.reforges);
  assert.deepEqual(c.s.rescued, original.rescued);
  assert.equal(c.zoneId, 'abyss');
  assert.equal(c.preparationTonicStock(), 2);
  assert(c.hero.tonic);
  assert.equal(c.s.party.at(-1).hp, 0);
  assert.equal(c.s.party.at(-2).active, false);
  c.clearTonic();
  assert.equal(c.companionInheritedHpBonus(), 0);
  for (const u of c.s.party) assert.equal(u.maxHp, c.companionMaxHp(u.type));
  const twice = C.restore(c.snapshot(), () => 0.9);
  assert.equal(twice.hero.gold, c.hero.gold);
  assert.equal(twice.hero.level, c.hero.level);
  assert.equal(twice.hero.xp, c.hero.xp);
  console.log('PASS immutable v0.8.118 fixture ' + row.name + ' import, tonic expiry and reimport');
}
