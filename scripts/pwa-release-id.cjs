'use strict';
// The game intentionally keeps its marketing/dev version between small updates.
// Service-worker bytes must nevertheless change for every published commit or
// an installed Safari/Home Screen PWA can remain on its previous offline cache.
const fs = require('node:fs');
const path = require('node:path');

const validCommit = (value) => /^[a-f0-9]{40}$/.test(value || '');

function stampWorker(source, commit, version) {
  if (!validCommit(commit)) throw Error('A complete Git commit SHA is required for PWA release stamping');
  if (typeof version !== 'string' || !version) throw Error('Package version required');
  const original = 'const CACHE_VERSION = ' + JSON.stringify('azeroth-app-v' + version) + ';';
  const revision = 'const CACHE_VERSION = ' +
    JSON.stringify('azeroth-app-v' + version + '-release-' + commit.slice(0, 12)) + ';';
  if (!source.includes(original))
    throw Error('Unexpected generated service worker cache version; refuse an unsafe release');
  // Only the published worker changes; the checked-in generated worker remains
  // reproducible and continues to pass scripts/build.cjs --check.
  return source.replace(original, revision);
}

function stampSite(site, commit, version) {
  if (!validCommit(commit)) throw Error('A complete Git commit SHA is required');
  const workerPath = path.join(site, 'sw.js');
  const buildPath = path.join(site, 'build.txt');
  if (fs.readFileSync(buildPath, 'utf8').trim() !== commit)
    throw Error('Release commit differs from packaged build.txt');
  const oldWorker = fs.readFileSync(workerPath, 'utf8');
  const stamped = stampWorker(oldWorker, commit, version);
  fs.writeFileSync(workerPath, stamped);
  return stamped;
}

module.exports = {stampWorker, stampSite, validCommit};
