'use strict';
// Melee Basic Reach balancing workbench. Zero runtime/asset/build dependencies.
// All authored numbers live in src/prototype/rules.js::meleeReachTuning.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src/prototype/rules.js');
const evidencePath = path.join(root, 'docs/evidence/SPRITE_SCOPE_RECONCILIATION.json');
const sourceKey = 'src/prototype/rules.js';
const keys = ['shared', 'enemy', 'elite', 'soldier', 'pet', 'ringleaderStanceBonus'];
const overrides = new Set(['enemy', 'elite', 'soldier', 'pet']);
const help = `Melee basic reach balance workbench (world units).

  node scripts/tune-melee-reach.cjs --show
  node scripts/tune-melee-reach.cjs --all 80              # preview all roles, clear overrides
  node scripts/tune-melee-reach.cjs --all 80 --apply      # change all melee basics
  node scripts/tune-melee-reach.cjs --shared 85 --apply   # change inherited roles only
  node scripts/tune-melee-reach.cjs --enemy 85 --apply    # override ordinary enemies
  node scripts/tune-melee-reach.cjs --elite 100 --pet 75 --apply
  node scripts/tune-melee-reach.cjs --enemy inherit --apply # return to shared
  node scripts/tune-melee-reach.cjs --verify             # run native range tests

Settings: --all/--shared, --enemy, --elite, --soldier, --pet,
          --stance-bonus (hybrid Ringleader extra range), --apply, --verify.
Editing is PREVIEW ONLY unless --apply is specified.
The tool also refreshes the rules.js fingerprint in sprite scope evidence.
Skills, ranged attacks, the Paladin, the Archer and ranged pets are not tuned.
`;
function parseTable(source) {
  const region = /  const meleeReachTuning = Object\.freeze\(\{\n([\s\S]*?)\n  \}\);/;
  const match = source.match(region);
  if (!match) throw Error('Authoritative meleeReachTuning table not found');
  const values = {};
  for (const key of keys) {
    const r = new RegExp('^\\s*' + key + ':\\s*(null|[0-9]+),', 'm');
    const hit = match[1].match(r);
    if (!hit) throw Error('Missing or invalid melee tuning key: ' + key);
    values[key] = hit[1] === 'null' ? null : Number(hit[1]);
  }
  return values;
}
function validate(values) {
  for (const key of keys) {
    const v = values[key];
    if (v === null && overrides.has(key)) continue;
    const max = key === 'ringleaderStanceBonus' ? 100 : 200;
    const min = key === 'ringleaderStanceBonus' ? 0 : 30;
    if (!Number.isInteger(v) || v < min || v > max)
      throw Error(key + ' must be an integer from ' + min + ' to ' + max +
        (overrides.has(key) ? ', or inherit' : ''));
  }
}
function resolve(values) {
  validate(values);
  const actual = {
    enemy: values.enemy ?? values.shared,
    elite: values.elite ?? values.shared,
    soldier: values.soldier ?? values.shared,
    pet: values.pet ?? values.shared,
  };
  return { ...actual, ringleaderHybridStance: actual.elite + values.ringleaderStanceBonus };
}
function replaceTable(source, values) {
  validate(values);
  const original = parseTable(source);
  let updated = source;
  for (const key of keys) {
    const before = original[key] === null ? 'null' : String(original[key]);
    const after = values[key] === null ? 'null' : String(values[key]);
    const line = new RegExp('(^\\s*' + key + ':\\s*)' + before + '(,)', 'm');
    // Replace only within the identified authored table, never elsewhere.
    const start = updated.indexOf('  const meleeReachTuning = Object.freeze({');
    const end = updated.indexOf('\n  });', start);
    if (start < 0 || end < 0) throw Error('Malformed melee tuning table');
    const head = updated.slice(0, start), table = updated.slice(start, end + 6), tail = updated.slice(end + 6);
    if (!line.test(table)) throw Error('Cannot rewrite tuning key ' + key);
    updated = head + table.replace(line, (_, a, b) => a + after + b) + tail;
  }
  return updated;
}
function parseCli(argv) {
  const changes = {};
  let apply = false, verify = false, show = false;
  const map = { all: 'shared', shared: 'shared', enemy: 'enemy', elite: 'elite',
    soldier: 'soldier', pet: 'pet', 'stance-bonus': 'ringleaderStanceBonus' };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=');
    if (flag === '--apply' || flag === '--verify' || flag === '--show') {
      if (inline !== undefined) throw Error('Flag does not take a value: ' + flag);
      if (flag === '--apply') apply = true;
      if (flag === '--verify') verify = true;
      if (flag === '--show') show = true;
      continue;
    }
    if (flag === '--help' || flag === '-h') return { help: true };
    const key = map[flag.replace(/^--/, '')];
    if (!flag.startsWith('--') || !key) throw Error('Unknown flag: ' + flag);
    const str = inline ?? argv[++i];
    if (str === undefined) throw Error('Missing value: ' + flag);
    if ((str === 'inherit' || str === 'null') && overrides.has(key)) changes[key] = null;
    else if (/^\d+$/.test(str)) {
      if (flag === '--all') {
        // ALL really means all, even after earlier per-role experiments.
        // A later --pet/--soldier/etc flag can deliberately override it.
        for (const role of overrides) changes[role] = null;
      }
      changes[key] = Number(str);
    } else throw Error('Invalid ' + flag + ': ' + str);
  }
  if (apply && !Object.keys(changes).length) throw Error('--apply requires at least one tuning value');
  return { changes, apply, verify, show };
}
function report(values, label) {
  const a = resolve(values);
  console.log(label + '\n shared=' + values.shared +
    ' | enemy=' + a.enemy + ' | elite=' + a.elite +
    ' | Soldier=' + a.soldier + ' | melee pet=' + a.pet +
    ' | Ringleader hybrid switch=' + a.ringleaderHybridStance);
  console.log(' Overrides: ' + [...overrides].map(k => k + '=' +
    (values[k] === null ? 'inherit' : values[k])).join(', ') +
    ' | stance bonus=' + values.ringleaderStanceBonus);
  console.log(' Unchanged basics: Paladin 120, Archer 185, ranged pets 280; skills unaffected.');
}
function applyFiles(oldSource, newSource) {
  if (oldSource === newSource) return false;
  const oldDigest = crypto.createHash('sha256').update(oldSource).digest('hex');
  const nextDigest = crypto.createHash('sha256').update(newSource).digest('hex');
  const oldEvidence = fs.readFileSync(evidencePath, 'utf8');
  const evidence = JSON.parse(oldEvidence);
  if (evidence.sources?.[sourceKey] !== oldDigest)
    throw Error('Source fingerprint drift: run sprite scope reconciliation before tuning');
  const needle = '"' + sourceKey + '": "' + oldDigest + '"';
  if (oldEvidence.split(needle).length !== 2)
    throw Error('Expected exactly one original source fingerprint');
  const newEvidence = oldEvidence.replace(needle, '"' + sourceKey + '": "' + nextDigest + '"');
  // Both changes are validated before either file is written.
  fs.writeFileSync(sourcePath, newSource);
  fs.writeFileSync(evidencePath, newEvidence);
  return true;
}
function runTests() {
  for (const name of [
    'tests/melee-reach-balancing.test.cjs',
    'tests/enemy-melee-basic-reach-matrix.test.cjs',
    'tests/companion-melee-basic-reach.test.cjs',
    'tests/vale-melee-anti-kite.test.cjs',
    'tests/hybrid-dual-role-ai.test.cjs',
  ]) {
    console.log('Validating ' + name);
    const result = cp.spawnSync(process.execPath, [name], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) throw Error('Range validation failed: ' + name);
  }
}
function main() {
  const cmd = parseCli(process.argv.slice(2));
  if (cmd.help || (!cmd.show && !cmd.verify && !cmd.apply && !Object.keys(cmd.changes).length)) {
    console.log(help); return;
  }
  const previousSource = fs.readFileSync(sourcePath, 'utf8');
  const previous = parseTable(previousSource);
  const next = { ...previous, ...cmd.changes };
  validate(next);
  report(previous, 'Current:');
  if (Object.keys(cmd.changes).length) report(next, 'Proposed:');
  if (cmd.apply) {
    const changed = applyFiles(previousSource, replaceTable(previousSource, next));
    console.log(changed ? 'Updated rules.js and sprite scope fingerprint.' : 'No change needed.');
    console.log('Review the diff, run focused verification, then commit on a branch.');
  } else if (Object.keys(cmd.changes).length) {
    console.log('PREVIEW ONLY. Add --apply to write these settings.');
  }
  if (cmd.verify) runTests();
}
if (require.main === module) {
  try { main(); } catch (err) { console.error('Melee balancing error: ' + err.message); process.exitCode = 1; }
}
module.exports = { parseTable, validate, resolve, replaceTable, parseCli };
