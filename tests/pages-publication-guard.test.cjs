'use strict';
// The owner may authorize a source merge without authorizing a Pages/PWA
// rollout. For a commit explicitly labeled [no-pages], keep focused tests but
// never upload a Pages artifact or enter the deploy job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('.github/workflows/focused-deploy.yml', 'utf8');
const condition = "if: github.event_name == 'push' && github.ref == 'refs/heads/main' && !contains(github.event.head_commit.message, '[no-pages]')";
assert.equal(source.split(condition).length - 1, 2,
  'both Pages artifact upload and deployment must require an unmarked main push');
const upload = source.split('- name: Upload validated Pages package')[1];
const deploy = source.split('\n  deploy:')[1];
assert(upload?.split('\n')[1]?.trim() === condition,
  'artifact upload must independently honor the no-pages marker');
assert(deploy?.split('\n').some(line => line.trim() === condition),
  'deployment job must independently honor the no-pages marker');
assert(source.includes("  push:\n    branches: [main]"),
  'no-pages marker cannot suppress branch CI itself');
console.log('PASS code-only main merges remain tested; [no-pages] prevents automatic Pages/PWA publication');
