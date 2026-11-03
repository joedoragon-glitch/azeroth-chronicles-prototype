'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const title = "So I Became the Dark Lord's Problem";
const template = read('templates/game.html');
for (const entry of ['index.html', 'prototype.html', 'phone.html']) {
  const page = read(entry);
  assert(page.includes('<title>' + title + '</title>'), entry + ' document title');
  assert(page.includes('<h1>' + title + '</h1>'), entry + ' game heading');
}
assert(template.includes('<title>' + title + '</title>'));
assert(template.includes('<h1>' + title + '</h1>'));
const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.name, title);
assert.equal(manifest.short_name, "Lord's Problem");
assert.equal(manifest.id, './', 'preserve installed PWA identity');
assert.equal(manifest.start_url, './phone.html', 'preserve the installed launch route');
assert.equal(manifest.scope, './', 'preserve installed PWA scope');
assert(read('README.md').startsWith('# ' + title));
const originalScore = JSON.parse(read('tools/audio/score-book.json'));
assert.equal(originalScore.cues.title.title, title, 'title music uses current display name');
assert.equal(originalScore.cues.title.role, 'title', 'title-score cue role unchanged');
assert(originalScore.author.includes('Azeroth Chronicles'), 'original score provenance retained');
assert(read('tools/audio/index.html').includes('<p class="eyebrow">' + title + '</p>'));
assert(
  read('src/prototype/app.js').includes('So I Became the Dark Lord'),
  'installation must use the new name',
);
assert(
  read('sw.js').includes("const CACHE_PREFIX = 'azeroth-app-';"),
  'old cache prefix stays for safe cleanup',
);
// Current copy-ready image prompts must never inherit the retired title.
const catalog = read('docs/GRAPHICS_CANON_SPRITE_PROMPTS.md');
const prompts = [
  ...catalog.matchAll(/\*\*Image-generation prompt:\*\*\s*\n\s*> ([^\n]+)/g),
].map((match) => match[1]);
assert.equal(prompts.length, 281, 'Rogue added without losing unused sprite entries');
assert(
  prompts.every((prompt) => !prompt.includes('Azeroth Chronicles')),
  'retired public title cannot enter current image prompts',
);
assert.equal(
  prompts.filter((prompt) => prompt.includes('for ' + title + '.')).length,
  279,
  'title-bearing prompts use official game name; two asset-specific prompts remain title-free',
);
const registry = JSON.parse(read('tools/sprites/approved.json'));
const spriteManifest = JSON.parse(read('assets/sprites/manifest.json'));
const bindings = new Map(
  JSON.parse(read('tools/sprites/specifications.json')).assets.map((entry) => [
    entry.key,
    entry.catalogId,
  ]),
);
const retained = new Set([
  ...Object.keys(spriteManifest.sprites),
  ...Object.keys(registry.assets),
  ...Object.keys(registry.history || {}),
]);
assert(Object.keys(spriteManifest.sprites).length >= 33, 'registered art identities cannot silently shrink');
assert(Object.keys(registry.history || {}).length >= 34, 'unused art history cannot silently shrink');
for (const key of retained) {
  const id = bindings.get(key);
  assert(id, 'retained art needs an exact catalog identity: ' + key);
  const tick = String.fromCharCode(96);
  assert(
    catalog.includes('| ' + tick + id + tick + ' | ' + tick + key + tick + ' |'),
    'crosswalk must retain registered or unused sprite: ' + key,
  );
}
assert(catalog.includes('### 297 — Hero — Rogue (Pícara)'), 'Rogue must be catalogued');
assert(!spriteManifest.sprites['hero:rogue'], 'do not fabricate a Rogue raster sprite');
console.log('PASS official branding, PWA identity and legacy cache compatibility');
