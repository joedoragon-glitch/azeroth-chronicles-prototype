'use strict';
// The game intentionally keeps its marketing/dev version between small updates.
// Service-worker bytes must nevertheless change for every published commit or
// an installed Safari/Home Screen PWA can remain on its previous offline cache.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

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

// Site-only provenance: the script loaded by a cached/offline page must identify
// the SAME commit as build.txt and the service worker. Never mutate checked-in
// generated build-info.js; its source hash must remain reproducible.
function stampBuildInfo(source, commit, version) {
  if (!validCommit(commit)) throw Error('A complete Git commit SHA is required');
  const expected = 'Object.freeze({version:' + JSON.stringify(version) + '})';
  if (!source.includes(expected))
    throw Error('Unexpected generated build metadata; refuse an unsafe release');
  return source.replace(
    expected,
    'Object.freeze({version:' + JSON.stringify(version) +
      ',commit:' + JSON.stringify(commit) + '})',
  );
}

function gitBlobHash(content) {
  const bytes = Buffer.from(content, 'utf8');
  return crypto.createHash('sha1')
    .update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
}

function stampSite(site, commit, version) {
  if (!validCommit(commit)) throw Error('A complete Git commit SHA is required');
  const workerPath = path.join(site, 'sw.js');
  const buildPath = path.join(site, 'build.txt');
  const buildInfoPath = path.join(site, 'src/prototype/build-info.js');
  if (fs.readFileSync(buildPath, 'utf8').trim() !== commit)
    throw Error('Release commit differs from packaged build.txt');
  const originalBuildInfo = fs.readFileSync(buildInfoPath, 'utf8');
  const stampedBuildInfo = stampBuildInfo(originalBuildInfo, commit, version);
  const oldWorker = fs.readFileSync(workerPath, 'utf8');
  const oldFingerprint = '"./src/prototype/build-info.js":' +
    JSON.stringify(gitBlobHash(originalBuildInfo));
  const newFingerprint = '"./src/prototype/build-info.js":' +
    JSON.stringify(gitBlobHash(stampedBuildInfo));
  const stampedWorker = stampWorker(oldWorker, commit, version);
  if (!stampedWorker.includes(oldFingerprint))
    throw Error('Build metadata fingerprint does not match offline asset inventory');
  const nextWorker = stampedWorker.replace(oldFingerprint, newFingerprint);
  // Validate every input above BEFORE changing the deployable site.
  fs.writeFileSync(buildInfoPath, stampedBuildInfo);
  fs.writeFileSync(workerPath, nextWorker);
  return nextWorker;
}

module.exports = {stampWorker, stampBuildInfo, stampSite, validCommit};
