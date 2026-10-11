'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto');
const { worker, inventory, fixtures } = require('./helpers/perf-ws4-worker.cjs');
assert.equal(
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, 'fixtures/perf-ws4-service-worker-baseline.txt')))
    .digest('hex'),
  'ac5673913d3d33b6a2572e90416c0dde6a97a3e56363127c280f21d6192fefdc',
  'The archived service-worker template remains the exact shared baseline source',
);
async function responseValue(response) {
  if (!response) return null;
  return {
    status: response.status,
    headers: [...response.headers],
    body: Buffer.from(await response.arrayBuffer()).toString('base64'),
  };
}
async function compareScenario(options, exercise) {
  const before = worker({ ...options, baseline: true }),
    after = worker(options);
  const a = await exercise(before),
    b = await exercise(after);
  assert.deepEqual(b, a);
  assert.deepEqual(after.trace, before.trace, 'network/cache request order and URLs are preserved');
  for (const key of ['network', 'opens', 'skipped', 'claimed'])
    assert.equal(after.state[key], before.state[key], key);
}
(async () => {
  for (const scope of [
    'https://example.test/game/',
    'https://example.test/',
    'https://example.test/nested/game/',
  ]) {
    await compareScenario({ scope }, async (w) => {
      await w.emit('install');
      await w.emit('activate');
      const request = (file, mode = 'navigate', method = 'GET') => ({
        url: scope + file,
        method,
        mode,
      });
      const requests = [
        ...inventory.core.map((file) =>
          request(file + '?v=test#fragment', file.endsWith('.html') ? 'navigate' : 'cors'),
        ),
        ...[...fixtures.images.keys()].map((file) => request(file + '?v=test#fragment', 'cors')),
        ...[
          '?launch=installed',
          'unknown/path',
          'nested/phone.html',
          'nested/legacy.html',
          'nested/prototype.html',
          'rts.html',
          'nested/rts.html',
        ].map((file) => request(file)),
        request('unknown.png', 'cors'),
        request('index.html', 'navigate', 'POST'),
        { url: 'https://foreign.test/game/index.html', method: 'GET', mode: 'navigate' },
        { url: 'https://example.test/sibling/index.html', method: 'GET', mode: 'cors' },
      ];
      const results = [];
      for (const req of requests)
        results.push(await responseValue(await w.emit('fetch', { request: req })));
      w.state.offline = true;
      for (const req of requests)
        results.push(await responseValue(await w.emit('fetch', { request: req })));
      return results;
    });
  }
  console.log(
    'PASS baseline-equivalent online/offline requests, headers/bytes, query normalization, subpaths, public and historical navigation',
  );
  for (const options of [
    { malformed: true },
    { missing: [...fixtures.images.keys()][1] },
    { missing: 'src/prototype/engine.js' },
  ]) {
    await compareScenario(options, async (w) => {
      let failed = false;
      try {
        await w.emit('install');
      } catch (_) {
        failed = true;
      }
      w.state.offline = true;
      const response = await responseValue(
        await w.emit('fetch', {
          request: { url: 'https://example.test/game/phone.html', method: 'GET', mode: 'navigate' },
        }),
      );
      return { failed, retained: w.stores.has('azeroth-app-old'), response };
    });
  }
  await compareScenario({}, async (w) => {
    w.state.offline = true;
    const response = await responseValue(
      await w.emit('fetch', {
        request: { url: 'https://example.test/game/phone.html', method: 'GET', mode: 'navigate' },
      }),
    );
    await w.emit('message', { data: { type: 'SKIP_WAITING' } });
    return response;
  });
  console.log(
    'PASS missing cache, failed/partial installs, old-cache retention, malformed manifest and explicit update semantics',
  );
  const before = worker({ baseline: true, routeOnly: true }),
    after = worker({ routeOnly: true });
  before.state.urls = after.state.urls = 0;
  const staticRequests = inventory.core
    .filter((file) => !file.endsWith('.html'))
    .map((file) => ({
      url: 'https://example.test/game/' + file + '?v=1',
      method: 'GET',
      mode: 'cors',
    }));
  for (const request of staticRequests) {
    before.route(request);
    after.route(request);
  }
  assert.equal(after.state.urls, staticRequests.length);
  assert.equal(before.state.urls, staticRequests.length * 5);
  console.log(
    `PASS ${staticRequests.length} real static inventory requests: URL constructions ${before.state.urls} → ${after.state.urls} (80% fewer), identical cache handling`,
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
