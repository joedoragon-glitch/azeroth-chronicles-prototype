'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const SpriteFormat = require('../src/prototype/sprite-format.js');
const root = path.resolve(__dirname, '..'),
  { scripts, core, legacy } = require('./site-assets.cjs'),
  pkg = require('../package.json');
// Locally bundle the pinned PixiJS dependency before generating the PWA.
// Clean checkouts, including CI --check runs, prepare this build-only dependency.
// The running PWA loads ONLY its same-origin copy.
cp.execFileSync(process.execPath, [path.join(__dirname, 'vendor-pixi.cjs'), '--ensure'], {
  stdio: 'inherit',
});
const check = process.argv.includes('--check'),
  site = process.argv.includes('--site'),
  read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const template = read('templates/game.html'),
  generated = new Map();
generated.set(
  'src/prototype/audio-library.js',
  `/* Generated from assets/audio/manifest.json. Edit the catalog, then run npm run build. */\n(function(root){'use strict';const api=${JSON.stringify(require('./audio-catalog.cjs').runtimeCatalog(JSON.parse(read('assets/audio/manifest.json'))))};if(typeof module!=='undefined')module.exports=api;else root.PrototypeAudioLibrary=api;})(typeof window!=='undefined'?window:globalThis);\n`,
);
for (const [file, entry] of [
  ['index.html', 'auto'],
  ['prototype.html', 'auto'],
  ['phone.html', 'phone'],
])
  generated.set(file, template.replace('{{ENTRY}}', entry));
generated.set(
  'src/prototype/build-info.js',
  `/* Generated from package.json. Run npm run build after a version change. */\n(function(root){'use strict';const api=Object.freeze({version:${JSON.stringify(pkg.version)}});if(typeof module!=='undefined')module.exports=api;else root.PrototypeBuild=api;})(typeof window!=='undefined'?window:globalThis);\n`,
);
generated.set(
  'sw.js',
  read('templates/service-worker.js')
    .replace('{{SPRITE_FORMAT}}', read('src/prototype/sprite-format.js'))
    .replace('{{CACHE_VERSION}}', JSON.stringify('azeroth-app-v' + pkg.version))
    .replace('{{APP_FILES}}', JSON.stringify(['./', ...core.map((p) => './' + p)]))
    .replace('{{LEGACY_FILES}}', JSON.stringify(legacy.map((p) => './' + p))),
);
for (const [file, content] of generated) {
  if (check) {
    if (read(file) !== content) throw Error(file + ' is stale. Run npm run build.');
  } else fs.writeFileSync(path.join(root, file), content);
}
for (const file of [...core, ...legacy]) {
  if (!fs.existsSync(path.join(root, file))) throw Error('Missing published asset: ' + file);
}
const order = [...template.matchAll(/<script src="\.\/([^"]+)"/g)].map((m) => m[1]);
if (JSON.stringify(order) !== JSON.stringify(scripts))
  throw Error('Entry script order differs from asset inventory.');
const sprites = JSON.parse(read('assets/sprites/manifest.json'));
const spriteRoot = fs.realpathSync(path.join(root, 'assets/sprites')) + path.sep;
const spriteResources = SpriteFormat.resources(sprites);
for (const entry of spriteResources)
  if (entry?.src) {
    const file = entry.src.replace(/^\.\//, '');
    if (
      !file.startsWith('assets/sprites/') ||
      file.includes('..') ||
      !fs.existsSync(path.join(root, file)) ||
      !fs.statSync(path.join(root, file)).isFile() ||
      !fs.realpathSync(path.join(root, file)).startsWith(spriteRoot)
    )
      throw Error('Missing or invalid sprite: ' + file);
  }
// Reject invalid assets before starting a syntax-check process for every script.
for (const file of [...core, ...legacy])
  if (file.endsWith('.js')) cp.execFileSync(process.execPath, ['--check', path.join(root, file)]);
if (site) {
  const target = path.join(root, '_site');
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target);
  for (const file of new Set([
    ...core,
    ...legacy,
    'sw.js',
    // Independent diagnostics: published as an optional page, never loaded by
    // the game, added to the PWA offline manifest, or enabled in production.
    'tools/webgl-pilot/index.html',
    'tools/webgl-pilot/pilot.js',
    'tools/webgl-pilot/full-world.html',
    'tools/webgl-pilot/full-world.js',
    'tools/webgl-pilot/hybrid.html',
    'tools/webgl-pilot/hybrid.js',
    'tools/webgl-pilot/strategy-lab.html',
    'tools/webgl-pilot/strategy-lab.js',
    'tools/webgl-pilot/real-world-gpu.html',
    'tools/webgl-pilot/real-world-gpu.js',
    'tools/webgl-pilot/canvas-vs-webgl.html',
    'tools/webgl-pilot/canvas-vs-webgl.js',
    'tools/webgl-pilot/pixi-real-world.html',
    'tools/webgl-pilot/pixi-real-world.js',
    'tools/webgl-pilot/pixi-scene-bridge.js',
    'tools/webgl-pilot/native-webgl2-core.js',
    'tools/webgl-pilot/native-sprite-adapter.js',
    ...spriteResources.map((e) => e.src?.replace(/^\.\//, '')).filter(Boolean),
  ])) {
    const dest = path.join(target, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, file), dest);
  }
  fs.writeFileSync(
    path.join(target, 'build.txt'),
    (process.env.GITHUB_SHA ||
      cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()) + '\n',
  );
  // Always publish a new worker when game code changes, even between package
  // version bumps. Only the release copy is stamped; the source is unchanged.
  if (/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA || ''))
    require('./pwa-release-id.cjs').stampSite(target, process.env.GITHUB_SHA, pkg.version);
}
console.log(
  'PASS ' +
    (check ? 'Generated files and syntax verified' : 'Built') +
    ' · ' +
    pkg.version +
    ' · ' +
    core.length +
    ' campaign assets · ' +
    legacy.length +
    ' optional historical assets',
);
