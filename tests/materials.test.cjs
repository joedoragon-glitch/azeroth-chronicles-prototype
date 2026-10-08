'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const Materials = require('../src/prototype/materials.js'),
  Contract = require('../src/prototype/material-contract.js'),
  Pipeline = require('../scripts/material-pipeline.cjs');
const hash = (n) => n.toString(16).padStart(64, '0');
const entry = (n) => ({
  src: './assets/materials/test-' + n + '.png',
  hash: hash(n),
  width: 256,
  height: 256,
  worldSpan: 320,
  opacity: 0.28,
  revision: hash(n),
});
(async () => {
  assert.throws(() =>
    Contract.entries({
      version: 1,
      materials: { 'terrain:ground:vale': { ...entry(1), src: 'https://example.com/a.png' } },
    }),
  );
  assert.throws(() =>
    Contract.entries({
      version: 1,
      materials: { 'terrain:ground:vale': { ...entry(1), width: 4096 } },
    }),
  );
  const jobs = [];
  class FakeImage {
    set src(value) {
      this.value = value;
      jobs.push(this);
    }
  }
  const layer = new Materials({ Image: FakeImage });
  const bank = Object.fromEntries(
    Array.from({ length: 28 }, (_, n) => ['terrain:floor:test-' + n, entry(n + 1)]),
  );
  assert(layer.install({ version: 1, materials: bank }));
  layer.beginFrame();
  const waits = Object.keys(bank).map((k) => layer.ensure(k));
  assert.equal(jobs.length, 0);
  layer.endFrame();
  assert.equal(jobs.length, 2);
  while (layer.pending.size) {
    const image = jobs.shift();
    assert(image);
    image.width = image.height = 256;
    image.onload();
    await new Promise((r) => setImmediate(r));
  }
  await Promise.all(waits);
  assert(layer.bytes <= 2 * 1024 * 1024);
  assert(layer.stats.peakConcurrent <= 2);
  assert(layer.stats.evictions >= 20);
  const stale = layer.ensure('terrain:floor:test-0');
  layer.install({ version: 1, materials: {} });
  for (const img of jobs.splice(0)) {
    img.width = img.height = 256;
    img.onload();
  }
  assert.equal(await stale, null);
  assert.equal(layer.bytes, 0);
  assert(layer.stats.staleLoads > 0);
  const stalled = new Materials({ Image: FakeImage, timeout: 20 });
  stalled.install({ version: 1, materials: bank });
  const expired = stalled.ensure('terrain:floor:test-0');
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(await expired, null);
  assert.equal(stalled.decoding, 0, 'a hung decode releases its slot');
  assert.equal(stalled.reserved, 0);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'material-pipeline-'));
  try {
    const tile = createCanvas(256, 256),
      ctx = tile.getContext('2d');
    ctx.fillStyle = '#294b36';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const g = 4 * Math.sin((x * Math.PI * 2) / 255) * Math.cos((y * Math.PI * 2) / 255);
        ctx.fillStyle = `rgb(${Math.round(41 + g)},${Math.round(75 + g)},${Math.round(54 + g)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    const source = path.join(dir, 'source.png');
    fs.writeFileSync(source, tile.toBuffer('image/png'));
    const record = await Pipeline.prepare('T001', source, path.join(dir, 'candidate'));
    assert.equal(
      record.source.hash,
      require('node:crypto').createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
    );
    assert(record.output.seams.x < 0.01 && record.output.seams.y < 0.01);
    const alpha = createCanvas(256, 256);
    fs.writeFileSync(path.join(dir, 'transparent.png'), alpha.toBuffer('image/png'));
    await assert.rejects(Pipeline.inspect(path.join(dir, 'transparent.png'), true), /opaque/);
    const native = await loadImage(tile.toBuffer('image/png'));
    class NativeImage {
      set src(_) {
        const image = native;
        this.width = image.width;
        this.height = image.height;
        this.native = image;
        queueMicrotask(() => this.onload());
      }
    }
    const paintLayer = new Materials({ Image: NativeImage });
    const e = entry(100);
    paintLayer.install({ version: 1, materials: { 'terrain:ground:vale': e } });
    await paintLayer.ensure('terrain:ground:vale');
    // Use the decoded native image to verify phase after camera movement and exact clipping.
    const resource = paintLayer.cache.get(paintLayer.identity(e));
    resource.image = resource.image.native;
    const render = (dx) => {
      const c = createCanvas(320, 220),
        q = c.getContext('2d');
      q.fillStyle = '#112233';
      q.fillRect(0, 0, 320, 220);
      const screen = (p) => ({ x: (p.x - p.y) * 0.76 + 100 + dx, y: (p.x + p.y) * 0.27 + 20 });
      assert(
        paintLayer.paint(q, 'terrain:ground:vale', screen, [
          { x: 0, y: 0 },
          { x: 120, y: 0 },
          { x: 120, y: 120 },
          { x: 0, y: 120 },
        ]),
      );
      return q.getImageData(0, 0, 320, 220).data;
    };
    const a = render(0),
      b = render(20);
    for (let y = 30; y < 80; y++)
      for (let x = 80; x < 120; x++)
        for (let channel = 0; channel < 4; channel++)
          assert.equal(
            a[(y * 320 + x) * 4 + channel],
            b[(y * 320 + x + 20) * 4 + channel],
            'grain follows world rather than camera',
          );
    assert.deepEqual([...a.subarray(0, 4)], [17, 34, 51, 255], 'clip leaves void untouched');
    const before = JSON.stringify(require('../assets/materials/manifest.json'));
    await Pipeline.check();
    assert.equal(JSON.stringify(require('../assets/materials/manifest.json')), before);
    // Exercise real registration and retained revisions in a disposable checkout.
    const checkout = path.join(dir, 'checkout'),
      root = path.resolve(__dirname, '..');
    fs.mkdirSync(checkout);
    for (const name of ['scripts', 'src', 'tools/sprites', 'assets'])
      fs.cpSync(path.join(root, name), path.join(checkout, name), { recursive: true });
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(checkout, 'node_modules'), 'dir');
    fs.writeFileSync(
      path.join(checkout, 'assets/materials/manifest.json'),
      JSON.stringify({ version: 1, materials: {} }),
    );
    fs.writeFileSync(
      path.join(checkout, 'tools/sprites/materials/approved.json'),
      JSON.stringify({ version: 1, assets: {}, history: {} }),
    );
    const isolated = require(path.join(checkout, 'scripts/material-pipeline.cjs'));
    const review = {
      status: 'approved',
      reference: 'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/111',
      nativeScale: true,
      wrap: true,
      kind: 'test-fixture',
    };
    record.review = review;
    fs.writeFileSync(path.join(dir, 'candidate/candidate.json'), JSON.stringify(record));
    const first = await isolated.publish(path.join(dir, 'candidate/candidate.json'));
    record.runtime.opacity = 0.25;
    fs.writeFileSync(path.join(dir, 'candidate/candidate.json'), JSON.stringify(record));
    await assert.rejects(isolated.publish(path.join(dir, 'candidate/candidate.json')), /lease/);
    const second = await isolated.publish(
      path.join(dir, 'candidate/candidate.json'),
      first.revision,
    );
    await assert.rejects(isolated.rollback(first.key, 'procedural', first.revision), /lease/);
    await isolated.rollback(first.key, first.revision, second.revision);
    await isolated.rollback(first.key, 'procedural', first.revision);
    await isolated.rollback(first.key, second.revision, 'absent');
    assert.equal((await isolated.check()).active, 1);
    const retained = JSON.parse(
      fs.readFileSync(path.join(checkout, 'tools/sprites/materials/approved.json')),
    );
    assert.equal(retained.history[first.key].length, 2);
    const { core } = require(path.join(checkout, 'scripts/site-assets.cjs'));
    const materialFile = 'assets/materials/' + record.output.hash + '.png';
    assert(core.includes(materialFile), 'active material is enumerated for deployment/offline');
    const worker = fs
      .readFileSync(path.join(root, 'templates/service-worker.js'), 'utf8')
      .replace(
        '{{SPRITE_FORMAT}}',
        fs.readFileSync(path.join(root, 'src/prototype/sprite-format.js'), 'utf8'),
      )
      .replace('{{CACHE_VERSION}}', '"azeroth-app-material-fixture"')
      .replace('{{APP_FILES}}', JSON.stringify(core.map((f) => './' + f)))
      .replace('{{LEGACY_FILES}}', '[]');
    const offline = (missing) => {
      const handlers = {},
        cache = new Map(),
        scope = 'https://example.test/game/';
      let skipped = 0,
        disconnected = false;
      const network = async (req) => {
        if (disconnected) throw Error('offline');
        const file = new URL(req.url || req).pathname.slice('/game/'.length);
        if (file === materialFile && missing) return new Response('', { status: 404 });
        if (file === 'assets/sprites/manifest.json') return new Response('{"sprites":{}}');
        return new Response(
          file === materialFile ? fs.readFileSync(path.join(checkout, file)) : 'fixture',
        );
      };
      const store = {
        async addAll(reqs) {
          const pending = [];
          for (const req of reqs) {
            const res = await network(req);
            if (!res.ok) throw Error('missing');
            pending.push([req.url, res]);
          }
          for (const pair of pending) cache.set(...pair);
        },
        async match(key) {
          return cache.get(typeof key === 'string' ? key : key.url)?.clone();
        },
        async put(key, res) {
          cache.set(key, res);
        },
      };
      require('node:vm').runInNewContext(worker, {
        Request,
        Response,
        URL,
        fetch: network,
        console,
        caches: { open: async () => store },
        self: {
          registration: { scope },
          addEventListener: (name, fn) => (handlers[name] = fn),
          skipWaiting: () => skipped++,
        },
      });
      return {
        async install() {
          let pending;
          handlers.install({
            waitUntil(p) {
              pending = p;
            },
          });
          await pending;
        },
        async read() {
          disconnected = true;
          let response;
          handlers.fetch({
            request: { url: scope + materialFile + '?v=qa', method: 'GET', mode: 'cors' },
            respondWith(p) {
              response = p;
            },
          });
          return Buffer.from(await (await response).arrayBuffer());
        },
        skipped: () => skipped,
      };
    };
    const ready = offline(false);
    await ready.install();
    assert.equal(ready.skipped(), 1);
    assert.deepEqual(await ready.read(), fs.readFileSync(path.join(checkout, materialFile)));
    const missing = offline(true);
    await assert.rejects(missing.install(), /missing/);
    assert.equal(missing.skipped(), 0, 'missing active texture cannot replace the installed build');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(
    'PASS opaque material preparation, seam diagnostics, world phase/clipping, stale loads and 28-resource bounded residency',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
