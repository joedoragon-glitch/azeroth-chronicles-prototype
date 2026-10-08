'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const root = path.resolve(__dirname, '..'),
  { scripts, core, legacy } = require('./site-assets.cjs'),
  pkg = require('../package.json');
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
  if (file.endsWith('.js')) cp.execFileSync(process.execPath, ['--check', path.join(root, file)]);
}
const order = [...template.matchAll(/<script src="\.\/([^"]+)"/g)].map((m) => m[1]);
if (JSON.stringify(order) !== JSON.stringify(scripts))
  throw Error('Entry script order differs from asset inventory.');
const sprites = JSON.parse(read('assets/sprites/manifest.json'));
const spriteRoot = fs.realpathSync(path.join(root, 'assets/sprites')) + path.sep;
for (const entry of Object.values(sprites.sprites || {}))
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
if (site) {
  const target = path.join(root, '_site');
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target);
  for (const file of new Set([
    ...core,
    ...legacy,
    'sw.js',
    ...Object.values(sprites.sprites || {})
      .map((e) => e.src?.replace(/^\.\//, ''))
      .filter(Boolean),
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
