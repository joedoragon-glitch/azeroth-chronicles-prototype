'use strict';
// One inventory drives entry validation, offline packaging and deployment.
const scripts = [
  'src/sprint.js',
  ...[
    'data',
    'rules',
    'world',
    'navigation',
    'progression',
    'save',
    'engine',
    'audio-catalog',
    'audio-runtime',
    'audio-score',
    'audio-effects',
    'audio',
    'visuals',
    'combat-visuals',
    'sprites',
    'build-info',
    'persistence',
    'platform',
    'input',
    'runtime',
    'renderer',
    'menus',
    'app',
  ].map((name) => 'src/prototype/' + name + '.js'),
];
const core = [
  'index.html',
  'prototype.html',
  'phone.html',
  'styles/prototype.css',
  'styles/desktop.css',
  'styles/phone.css',
  ...scripts,
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'assets/sprites/manifest.json',
  ...require('./audio-assets.cjs').publishedFiles(require('node:path').resolve(__dirname, '..')),
];
const legacy = [
  'legacy.html',
  'rts.html',
  'styles/rts.css',
  'styles/game.css',
  'styles/app.css',
  'styles/keyboard.css',
  ...['rts-engine', 'rts', 'controls', 'classes', 'world', 'squad', 'game', 'app'].map(
    (name) => 'src/' + name + '.js',
  ),
];
module.exports = { scripts, core, legacy };
