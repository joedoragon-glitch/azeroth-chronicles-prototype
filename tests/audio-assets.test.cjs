'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  cp = require('node:child_process'),
  crypto = require('node:crypto'),
  vm = require('node:vm');
const { publishedFiles, limits } = require('../scripts/audio-assets.cjs'),
  root = path.resolve(__dirname, '..'),
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-audio-'));
// A silent PCM container is an isolated packaging fixture, never production sound.
const wav = Buffer.alloc(64);
wav.write('RIFF');
wav.writeUInt32LE(56, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24);
wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(20, 40);
const production = fs.readFileSync(path.join(root, 'assets/audio/manifest.json'));
async function offlineContract(checkout) {
  const source = fs.readFileSync(path.join(checkout, 'sw.js'), 'utf8'),
    scope = 'https://example.test/azeroth-chronicles-prototype/',
    handlers = {},
    current = new Map(),
    old = new Map([['keep', new Response('previous playable build')]]);
  let offline = false,
    missing = false,
    fetches = 0,
    skipped = 0;
  const caches = {
    async open() {
      return {
        async addAll(requests) {
          const staged = [];
          for (const req of requests) {
            const r = await network(req);
            if (!r.ok) throw Error('missing asset');
            staged.push([req.url, r]);
          }
          for (const [k, r] of staged) current.set(k, r);
        },
        async match(k) {
          return current.get(k)?.clone();
        },
        async put(k, r) {
          current.set(k, r);
        },
      };
    },
    async keys() {
      return ['azeroth-app-old'];
    },
    async delete() {
      old.clear();
    },
  };
  async function network(req) {
    fetches++;
    if (offline) throw Error('offline');
    const rel =
      new URL(req.url || req).pathname.slice(new URL(scope).pathname.length) || 'index.html';
    if (missing && rel === 'assets/audio/fixture.wav')
      return new Response('missing', { status: 404 });
    return new Response(fs.readFileSync(path.join(checkout, rel)));
  }
  const self = {
    registration: { scope },
    addEventListener(k, fn) {
      handlers[k] = fn;
    },
    skipWaiting() {
      skipped++;
    },
    clients: { claim() {} },
  };
  vm.runInNewContext(source, { self, caches, URL, Request, Response, fetch: network });
  const install = () => {
    let p;
    handlers.install({
      waitUntil(value) {
        p = value;
      },
    });
    return p;
  };
  missing = true;
  await assert.rejects(install());
  assert.equal(skipped, 0);
  assert.equal(old.size, 1);
  missing = false;
  await install();
  assert.equal(skipped, 1);
  offline = true;
  const before = fetches;
  for (const rel of [
    'assets/audio/fixture.wav',
    'assets/audio/manifest.json',
    'src/prototype/enemy-presentation.js',
    'src/prototype/audio-enemy.js',
    'src/prototype/audio-catalog.js',
    'src/prototype/audio-assets.js',
    'src/prototype/audio-mixer.js',
    'src/prototype/audio-recordings.js',
    'src/prototype/audio-environment.js',
    'tools/audio/index.html',
    'tools/audio/audition.js',
    'src/prototype/audio-runtime.js',
    'src/prototype/audio-score.js',
    'src/prototype/audio-effects.js',
  ]) {
    let p;
    handlers.fetch({
      request: { url: scope + rel + '?v=fixture', method: 'GET', mode: 'cors' },
      respondWith(value) {
        p = value;
      },
    });
    const response = await p;
    assert.equal(response.status, 200);
    assert(
      Buffer.from(await response.arrayBuffer()).equals(fs.readFileSync(path.join(checkout, rel))),
    );
  }
  assert.equal(fetches, before);
  console.log(
    'PASS recorded-audio and all owners survive offline subpath/query requests; failed audio install preserves previous cache',
  );
}
(async () => {
  try {
    const checkout = path.join(temp, 'checkout');
    fs.mkdirSync(checkout);
    for (const dir of ['src', 'scripts', 'styles', 'templates', 'icons', 'assets', 'tools'])
      fs.cpSync(path.join(root, dir), path.join(checkout, dir), { recursive: true });
    for (const file of [
      'package.json',
      'index.html',
      'prototype.html',
      'phone.html',
      'legacy.html',
      'rts.html',
      'manifest.webmanifest',
      'sw.js',
    ])
      fs.copyFileSync(path.join(root, file), path.join(checkout, file));
    const fixture = path.join(checkout, 'assets/audio/fixture.wav');
    fs.writeFileSync(fixture, wav);
    const entry = {
      kind: 'music',
      src: './assets/audio/fixture.wav',
      duration: 20 / 16000,
      sha256: crypto.createHash('sha256').update(wav).digest('hex'),
      credits: { author: 'isolated test fixture', license: 'test only' },
    };
    const manifest = {
      schemaVersion: 1,
      assets: { 'fixture:music': entry, 'fixture:alias': entry },
    };
    const manifestFile = path.join(checkout, 'assets/audio/manifest.json'),
      write = (value) => fs.writeFileSync(manifestFile, JSON.stringify(value));
    write(manifest);
    assert.deepEqual(publishedFiles(checkout), [
      'assets/audio/manifest.json',
      'assets/audio/fixture.wav',
    ]);
    let run = cp.spawnSync(process.execPath, ['scripts/build.cjs', '--site'], {
      cwd: checkout,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_SHA: 'audio-fixture' },
    });
    assert.equal(run.status, 0, run.stderr);
    assert(fs.readFileSync(path.join(checkout, '_site/assets/audio/fixture.wav')).equals(wav));
    assert.equal(
      fs.readFileSync(path.join(checkout, '_site/build.txt'), 'utf8').trim(),
      'audio-fixture',
    );
    fs.writeFileSync(path.join(checkout, 'assets/audio/unregistered.wav'), wav);
    run = cp.spawnSync(process.execPath, ['scripts/build.cjs', '--check', '--site'], {
      cwd: checkout,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_SHA: 'audio-fixture' },
    });
    assert.equal(run.status, 0, run.stderr);
    assert(!fs.existsSync(path.join(checkout, '_site/assets/audio/unregistered.wav')));
    await offlineContract(checkout);
    const mutations = [
      { src: '../outside.wav' },
      { src: 'https://other.test/music.mp3' },
      { src: './assets/audio/missing.wav' },
      { sha256: '0'.repeat(64) },
      { credits: {} },
      { kind: 'unknown' },
      { duration: -1 },
      { loop: { start: 1, end: 0 } },
      { loop: { start: 0, end: 99 } },
    ];
    for (const patch of mutations) {
      write({ schemaVersion: 1, assets: { bad: { ...entry, ...patch } } });
      assert.throws(() => publishedFiles(checkout), /Invalid audio asset/);
    }
    fs.writeFileSync(path.join(temp, 'outside.wav'), wav);
    fs.symlinkSync(path.join(temp, 'outside.wav'), path.join(checkout, 'assets/audio/outside.wav'));
    write({ schemaVersion: 1, assets: { bad: { ...entry, src: './assets/audio/outside.wav' } } });
    assert.throws(() => publishedFiles(checkout), /escaping symlink/);
    fs.writeFileSync(fixture, Buffer.alloc(limits.perFile + 1));
    write(manifest);
    assert.throws(() => publishedFiles(checkout), /size budget/);
    fs.writeFileSync(fixture, Buffer.alloc(64));
    write({
      ...manifest,
      assets: {
        bad: {
          ...entry,
          sha256: crypto.createHash('sha256').update(Buffer.alloc(64)).digest('hex'),
        },
      },
    });
    assert.throws(() => publishedFiles(checkout), /signature/);
    write({ schemaVersion: 2, assets: {} });
    assert.throws(() => publishedFiles(checkout), /schema/);
    console.log(
      'PASS registered-only packaging, deduplication, container/hash/provenance/loop validation, file budget and path/symlink containment',
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    assert(fs.readFileSync(path.join(root, 'assets/audio/manifest.json')).equals(production));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
