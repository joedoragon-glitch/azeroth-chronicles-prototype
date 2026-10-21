'use strict';
// Review-only historical controls. Source archives are pinned by archive-manifest.json;
// no current test/runtime is changed and no full historical campaign is certified.
// Usage: HISTORY_ARCHIVE_ROOT=/tmp node tools/survival-test-history-dev145/check.cjs
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  Module = require('node:module'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..'),
  archive = process.env.HISTORY_ARCHIVE_ROOT || '/tmp';
const fixture = require(path.join(root, 'tests/fixtures/snapshot-dread-rogue.json'));
const current = require(path.join(root, 'src/prototype/engine'));
const results = {};
results.rules = [95, 96].map((version) => {
  const filename = path.join(root, 'src/prototype/rules.js'),
    m = new Module(filename, module);
  m.filename = filename;
  m.paths = Module._nodeModulePaths(path.dirname(filename));
  m._compile(
    fs.readFileSync(path.join(archive, `history-dev${version}-rules.js`), 'utf8'),
    filename,
  );
  const rules = JSON.parse(JSON.stringify(m.exports.tacticalFoundation));
  const mismatches = [];
  for (const change of [
    ...fixture.approvedRuleChanges.changes,
    ...fixture.authorizedPlaytestChanges.changes,
    ...fixture.authorizedPr311SpeciesChanges.changes,
  ]) {
    let owner = rules;
    for (const key of change.path.slice(0, -1)) owner = owner[key];
    const key = change.path.at(-1);
    if (JSON.stringify(owner[key]) !== JSON.stringify(change.after))
      mismatches.push(change.path.join('.'));
    if (change.added) delete owner[key];
    else owner[key] = change.before;
  }
  const hash = crypto.createHash('sha256').update(JSON.stringify(rules)).digest('hex');
  return { version, hash, passesHistoricalRuleReceipt: hash === fixture.ruleSha256, mismatches };
});
results.cinder = [];
for (const version of [100, 101]) {
  const C = require(path.join(archive, `history-dev${version}/src/prototype/engine.js`));
  for (const form of ['normal', 'true']) {
    const c = new C('normal', 'mage', () => 0.9);
    c.enter('crown');
    const e = c.bossEnemy(c.boss('cindermaw'), form, { x: 2200, y: 1750 });
    c.zone().enemies = [e];
    Object.assign(c.hero, c.safe(e.x + 70, e.y));
    const gaps = c.cinderGapPlan(e, c.hero),
      weight = c.bossAttackWeights(e, c.hero)[0];
    e.telegraph = c.buildBossAttack(e, 0, c.hero).first;
    c.resolveAttack(e);
    results.cinder.push({
      version,
      form,
      ringRadius: C.rules.attacks.cindermaw[0].initialRadius,
      gaps,
      weight,
      ringCreated: !!e.cinderCordon,
    });
  }
}
results.nightmare = [120, 121].map((version) => {
  const source = fs.readFileSync(path.join(archive, `history-dev${version}-engine.js`), 'utf8');
  const methods = ['night', 'multipliers']
    .map((name) => source.match(new RegExp('^    (' + name + '\\([\\s\\S]+?^    })', 'm'))[1])
    .join('\n');
  const T = vm.runInNewContext('(class {' + methods + '})', { R: current.rules });
  const c = new T();
  c.s = { mode: 'nightmare', clock: 500, phase: 'awakening', nightmareIntroRemaining: 30 };
  c.peace = false;
  c.nightPoints = () => 20;
  return {
    version,
    probe: 'pinned methods, explicit new intro and twenty victories',
    night: c.night(),
    multipliers: c.multipliers(),
  };
});
const c = new current('nightmare', 'mage', () => 0.9);
c.zone().enemies = [];
c.s.party = [];
for (let i = 0; i < 100; i++) {
  c.s.time += 0.05;
  c.updateEnemies(0.05);
}
results.enemyOnlyNightmareFixture = {
  elapsed: 5,
  introRemaining: c.s.nightmareIntroRemaining,
  night: c.night(),
};
c.advanceDaylight(c.s.nightmareIntroRemaining);
results.afterActualNightBoundary = {
  introRemaining: c.s.nightmareIntroRemaining,
  night: c.night(),
};
console.log(JSON.stringify(results, null, 2));
