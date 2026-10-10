'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const root = path.resolve(__dirname, '../..'),
  inventory = require('../../scripts/site-assets.cjs'),
  fixtures = require('./sprite-fixtures.cjs');
function source(baseline = false) {
  return fs
    .readFileSync(
      path.join(
        root,
        baseline
          ? 'tests/fixtures/perf-ws4-service-worker-baseline.txt'
          : 'templates/service-worker.js',
      ),
      'utf8',
    )
    .replace(
      '{{SPRITE_FORMAT}}',
      fs.readFileSync(path.join(root, 'src/prototype/sprite-format.js'), 'utf8'),
    )
    .replace('{{CACHE_VERSION}}', JSON.stringify('azeroth-app-perf-ws4-fixture'))
    .replace('{{APP_FILES}}', JSON.stringify(['./', ...inventory.core.map((p) => './' + p)]))
    .replace('{{LEGACY_FILES}}', JSON.stringify(inventory.legacy.map((p) => './' + p)));
}
function worker({
  baseline = false,
  scope = 'https://example.test/game/',
  routeOnly = false,
  malformed = false,
  missing = '',
} = {}) {
  const handlers = {},
    stores = new Map(),
    trace = [];
  const state = { urls: 0, network: 0, opens: 0, offline: false, skipped: 0, claimed: 0 };
  stores.set('unrelated-cache', new Map());
  stores.set('azeroth-app-old', new Map());
  class CountedURL extends URL {
    constructor(...args) {
      super(...args);
      state.urls++;
    }
  }
  async function network(request) {
    const url = request.url || request;
    trace.push(['fetch', url, request.cache || '']);
    state.network++;
    if (state.offline) throw Error('offline');
    const file = new URL(url).pathname.slice(new URL(scope).pathname.length);
    if (missing && file === missing) return new Response('missing', { status: 404 });
    return new Response(
      file === 'assets/sprites/manifest.json'
        ? malformed
          ? 'malformed'
          : JSON.stringify(fixtures.animatedManifest())
        : fixtures.images.get(file) || 'fixture:' + file,
      { headers: { 'Content-Type': file.endsWith('.png') ? 'image/png' : 'text/plain' } },
    );
  }
  const caches = {
    open(name) {
      state.opens++;
      if (routeOnly) return { then() {} };
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return Promise.resolve({
        async match(key) {
          trace.push(['match', key]);
          return store.get(key)?.clone();
        },
        async put(key, response) {
          trace.push(['put', key]);
          store.set(key, response);
        },
        async addAll(requests) {
          const results = [];
          for (const request of requests) {
            const response = await network(request);
            if (!response.ok) throw Error('addAll failed');
            results.push([request.url, response]);
          }
          for (const [url, response] of results) store.set(url, response);
        },
      });
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      trace.push(['delete', name]);
      return stores.delete(name);
    },
  };
  const self = {
    registration: { scope },
    addEventListener(name, fn) {
      handlers[name] = fn;
    },
    async skipWaiting() {
      state.skipped++;
    },
    clients: {
      async claim() {
        state.claimed++;
      },
    },
  };
  vm.runInNewContext(source(baseline), {
    self,
    caches,
    URL: CountedURL,
    Request,
    Response,
    fetch: network,
  });
  function route(request) {
    handlers.fetch({ request, respondWith() {} });
  }
  async function emit(name, properties = {}) {
    let pending, response;
    handlers[name]({
      ...properties,
      waitUntil(p) {
        pending = p;
      },
      respondWith(p) {
        response = p;
      },
    });
    if (pending) await pending;
    return response ? await response : undefined;
  }
  return { state, stores, trace, route, emit };
}
module.exports = { worker, inventory, fixtures };
