'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const workflow=fs.readFileSync(path.join(root,'.github/workflows/pages.yml'),'utf8');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
const decisions=fs.readFileSync(path.join(root,'docs/DECISIONS.md'),'utf8');

assert(!Object.hasOwn(pkg.scripts||{},'release'),'canonical development must not require a portable single-HTML release script');
assert(!/Azeroth_Chronicles_Playtest\.html|build-release/i.test(workflow),'CI deployment must not depend on the historical portable HTML');
assert(readme.includes('canonical Azeroth Chronicles product is the multi-file GitHub Pages/PWA application'));
assert(decisions.includes('No feature, test, asset pipeline or release decision may require preserving a self-contained single-HTML build'));
console.log('PASS GitHub Pages/PWA multi-file architecture is canonical and portable HTML cannot constrain releases');
