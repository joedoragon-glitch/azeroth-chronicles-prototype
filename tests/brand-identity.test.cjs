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
console.log('PASS official branding, PWA identity and legacy cache compatibility');
