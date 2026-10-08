'use strict';
const fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict');
const fixtures = require('./helpers/sprite-fixtures.cjs'),
  root = path.resolve(__dirname, '..');
const production = fs.readFileSync(path.join(root, 'assets/sprites/manifest.json'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-sprite-contract-'));
try {
  const checkout = path.join(temp, 'checkout');
  fs.mkdirSync(checkout);
  for (const name of [
    'src',
    'styles',
    'templates',
    'scripts',
    'icons',
    'assets',
    'tests',
    'docs',
    'tools',
  ])
    fs.cpSync(path.join(root, name), path.join(checkout, name), { recursive: true });
  for (const name of [
    'package.json',
    'index.html',
    'prototype.html',
    'phone.html',
    'legacy.html',
    'rts.html',
    'manifest.webmanifest',
    'sw.js',
  ])
    fs.copyFileSync(path.join(root, name), path.join(checkout, name));
  for (const [file, bytes] of fixtures.images) fs.writeFileSync(path.join(checkout, file), bytes);
  const manifestFile = path.join(checkout, 'assets/sprites/manifest.json');
  const run = (manifest) => {
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    return cp.spawnSync(process.execPath, ['scripts/build.cjs', '--check', '--site'], {
      cwd: checkout,
      env: { ...process.env, GITHUB_SHA: 'isolated-fixture-revision' },
      encoding: 'utf8',
    });
  };
  for (const populated of [false, true]) {
    const manifest = fixtures.manifest(populated),
      result = run(manifest);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(checkout, '_site/assets/sprites/manifest.json'))),
      manifest,
    );
    const spriteTest = cp.spawnSync(process.execPath, ['tests/sprites.test.cjs'], {
      cwd: checkout,
      encoding: 'utf8',
    });
    assert.equal(spriteTest.status, 0, spriteTest.stderr);
    for (const [file, bytes] of fixtures.images) {
      const packaged = path.join(checkout, '_site', file);
      if (populated) assert(fs.readFileSync(packaged).equals(bytes));
      else assert(!fs.existsSync(packaged), 'unregistered fixture is excluded');
    }
    assert.equal(
      fs.readFileSync(path.join(checkout, '_site/build.txt'), 'utf8').trim(),
      'isolated-fixture-revision',
    );
  }
  const animated = fixtures.animatedManifest();
  const animatedResult = run(animated);
  assert.equal(animatedResult.status, 0, animatedResult.stderr);
  for (const [file, bytes] of fixtures.images)
    assert(fs.readFileSync(path.join(checkout, '_site', file)).equals(bytes));
  animated.sprites['hero:paladin'].clips.idle.frames[0].src = './assets/sprites/missing-atlas.png';
  assert.notEqual(run(animated).status, 0, 'missing frame-only resource blocks packaging');
  for (const src of [
    './assets/sprites/not-present.png',
    '../outside.png',
    'https://other.test/a.png',
    './assets/sprites/../outside.png',
    '/tmp/a.png',
  ]) {
    const manifest = fixtures.manifest(false);
    manifest.sprites['hero:paladin'] = { src };
    const result = run(manifest);
    assert.notEqual(result.status, 0, 'unsafe/missing path must reject: ' + src);
    assert.match(result.stderr, /Missing or invalid sprite/);
  }
  fs.writeFileSync(path.join(temp, 'outside.png'), [...fixtures.images.values()][0]);
  fs.symlinkSync(
    path.join(temp, 'outside.png'),
    path.join(checkout, 'assets/sprites/outside-link.png'),
  );
  const linked = fixtures.manifest(false);
  linked.sprites['hero:paladin'] = { src: './assets/sprites/outside-link.png' };
  const result = run(linked);
  assert.notEqual(
    result.status,
    0,
    'symlink must not package a file outside the declared asset tree',
  );
  assert.match(result.stderr, /Missing or invalid sprite/);
  console.log(
    'PASS empty/populated packaging, duplicate references, unregistered exclusion, missing/unsafe paths and symlink containment',
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
  assert(
    fs.readFileSync(path.join(root, 'assets/sprites/manifest.json')).equals(production),
    'production registry remains byte-for-byte unchanged even after failure',
  );
}
