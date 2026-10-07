'use strict';
// One inventory drives entry validation, offline packaging and deployment.
const scripts = [
  'src/sprint.js',
  ...[
    'data',
    'rules',
    'world',
    'navigation',
    'engine',
    'audio',
    'visuals',
    'combat-visuals',
    'sprites',
    'build-info',
    'persistence',
    'platform',
    'runtime',
    'renderer',
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
