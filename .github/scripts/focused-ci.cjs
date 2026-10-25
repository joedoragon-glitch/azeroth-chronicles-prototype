'use strict';
// Owner policy: ordinary PRs/pushes execute only tests relevant to touched paths.
// Full-game, all-browser and performance matrices are manual-only workflows.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const TEST = 'tests/';
const PILOT = 'tools/webgl-pilot/';
const groups = [
  {
    match: /^src\/prototype\/hero-combat\.js$/,
    tests: [
      TEST + 'cooldown-only.test.cjs',
      TEST + 'hero-skills-consolidation.test.cjs',
      TEST + 'charged-opener.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:combat|hero-combat|party|party-pets)\.js$/,
    tests: [TEST + 'charge-interruption.test.cjs', TEST + 'pet-skill-activation.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:app|input)\.js$/,
    tests: [TEST + 'hero-skill1-area3-input.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:hero-combat|combat|rules|save|engine)\.js$/,
    tests: [TEST + 'hero-skill1-stage1.test.cjs', TEST + 'hero-skill1-integration.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:boss-combat|hero-combat|engine)\.js$/,
    tests: [TEST + 'hero-skill1-retreats.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:hero-presentation|audio-hero|skill-reference|menus)\.js$/,
    tests: [TEST + 'hero-skill1-area2.test.cjs'],
  },
  {
    match:
      /(?:^|\/)(?:pixi-experimental\.js|pixi-scene-bridge\.js|native-sprite-adapter\.js|renderer-switch-guard\.js|native-webgl2-core\.js)$|^tests\/pixi-|^tools\/webgl-pilot\//,
    tests: [
      TEST + 'pixi-fidelity.test.cjs',
      TEST + 'pixi-step3-source.test.cjs',
      PILOT + 'pixi-scene-bridge.test.cjs',
      PILOT + 'renderer-switch-guard.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/renderer\.js$/,
    tests: [
      TEST + 'occlusion.test.cjs',
      TEST + 'terrain-effects.test.cjs',
      TEST + 'pixi-fidelity.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:visuals|hero-presentation)\.js$/,
    tests: [TEST + 'world-proportions.test.cjs', TEST + 'sprites.test.cjs'],
  },
  {
    match: /^src\/prototype\/engine\.js$|^src\/game\.js$/,
    tests: [TEST + 'game.test.cjs', TEST + 'daylight-cycle.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:app|menus)\.js$/,
    tests: [TEST + 'app.test.cjs', TEST + 'game-menu-ui.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:platform|runtime|frame-rate)\.js$/,
    tests: [TEST + 'platform-runtime.test.cjs', TEST + 'frame-rate.test.cjs'],
  },
  { match: /^src\/prototype\/runtime\.js$/, tests: [TEST + 'render-resolution.test.cjs'] },
  // Integration contracts: a test changed in the original feature PR must
  // continue protecting later source-only changes to its actual dependencies.
  {
    match: /^src\/prototype\/runtime\.js$/,
    tests: [
      TEST + 'frame-skip.test.cjs',
      TEST + 'auto-fps-adaptive-coupling.test.cjs',
      TEST + 'frame-profile.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:persistence|save)\.js$/,
    tests: [
      TEST + 'persistence-safety.test.cjs',
      TEST + 'save-recovery-checkpoints.test.cjs',
      TEST + 'save-writer.test.cjs',
      TEST + 'platform-runtime.test.cjs',
      TEST + 'restart-recovery.test.cjs',
      TEST + 'critical-restart-recovery.test.cjs',
      TEST + 'beta-historical.test.cjs',
      TEST + 'slow-cooldown.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/app\.js$/,
    tests: [
      TEST + 'persistence-safety.test.cjs',
      TEST + 'save-recovery-checkpoints.test.cjs',
      TEST + 'save-writer.test.cjs',
      TEST + 'restart-recovery.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/navigation\.js$/,
    tests: [
      TEST + 'navigation-route-stage4.test.cjs',
      TEST + 'crowd-collision-fast-reject.test.cjs',
      TEST + 'projectile-order.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:field-onboarding|engine)\.js$|^tests\/helpers\/field-opening\.cjs$/,
    tests: [
      TEST + 'night-tempo.test.cjs',
      TEST + 'field-onboarding.test.cjs',
      TEST + 'ranged-pet-support.test.cjs',
      TEST + 'enemy-support-healing.test.cjs',
    ],
  },
  {
    match:
      /^src\/prototype\/(?:engine|world|navigation)\.js$|^tests\/fixtures\/runtime-workload-dev175\.json$/,
    tests: [TEST + 'runtime-workload.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:rules|combat)\.js$/,
    tests: [
      TEST + 'slow-cooldown.test.cjs',
      TEST + 'ranged-pet-support.test.cjs',
      TEST + 'enemy-support-healing.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:rules|save|boss-combat)\.js$/,
    tests: [TEST + 'snapshot-encounter-lifecycle.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:combat|boss-combat|fortifications)\.js$/,
    tests: [TEST + 'projectile-order.test.cjs'],
  },
  {
    match: /^tests\/helpers\/production-shell\.cjs$/,
    tests: [
      TEST + 'persistence-safety.test.cjs',
      TEST + 'save-recovery-checkpoints.test.cjs',
      TEST + 'save-writer.test.cjs',
      TEST + 'render-resolution.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:audio[^/]*\.js)$|^assets\/audio\//,
    tests: [TEST + 'audio-catalog.test.cjs', TEST + 'audio-scheduler.test.cjs'],
  },
  {
    match: /^src\/prototype\/sprites\.js$|^assets\/sprites\/|^tools\/sprites\//,
    tests: [TEST + 'sprites.test.cjs', TEST + 'sprite-lifecycle.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:materials|ground-cache)\.js$|^assets\/materials\//,
    tests: [TEST + 'materials.test.cjs', TEST + 'ground-cache.test.cjs'],
  },
  {
    match:
      /^scripts\/(?:sprite-pipeline|sprite-scope-audit|material-pipeline)\.cjs$|^tools\/sprites\/(?:terrain-specifications\.json|approved\.json|materials\/approved\.json)$|^assets\/(?:sprites|materials)\/manifest\.json$/,
    tests: [TEST + 'artwork-pipeline-checks.test.cjs'],
  },
  { match: /^src\/prototype\/input\.js$/, tests: [TEST + 'input.test.cjs'] },
  {
    match: /^src\/prototype\/.*(?:combat|enemy|pet|skills).*\.js$/,
    tests: [TEST + 'combat-conditions.test.cjs', TEST + 'pet-skill-effects.test.cjs'],
  },
  { match: /^\.github\//, tests: [TEST + 'ci-focus-policy.test.cjs', TEST + 'ci-scope.test.cjs'] },
  {
    match: /^scripts\/(?:build|site-assets|vendor-pixi)\.(?:cjs|js)$|^templates\//,
    tests: [TEST + 'asset-packaging.test.cjs'],
  },
  // Versioned PWA assets need the deployable package and offline cache
  // regressions, not the generic architecture-only fallback.
  {
    match: /^(?:package(?:-lock)?\.json|sw\.js|src\/prototype\/build-info\.js)$/,
    tests: [TEST + 'pwa-release-id.test.cjs', TEST + 'service-worker.test.cjs'],
  },
];
const eligible = (file) =>
  /\.(?:js|cjs|mjs|json|css|html|webp|png|svg|mp3|ogg|yml|yaml)$/.test(file);
const relevant = (file) =>
  file.startsWith('src/') ||
  file.startsWith('tools/') ||
  file.startsWith('scripts/') ||
  file.startsWith('assets/') ||
  file.startsWith('tests/') ||
  file.startsWith('templates/') ||
  file.startsWith('.github/') ||
  [
    'package.json',
    'package-lock.json',
    'index.html',
    'phone.html',
    'prototype.html',
    'sw.js',
  ].includes(file);
function selectTests(changed, exists = (file) => fs.existsSync(path.join(root, file))) {
  const chosen = new Set(),
    uncovered = [],
    missing = new Set();
  for (const file of changed) {
    if (!relevant(file) || !eligible(file)) continue;
    let covered = false;
    // One explicitly changed Pixi acceptance test may run as a focused
    // browser smoke. Never select an entire browser matrix by subsystem.
    if (file === TEST + 'pixi-renderer-browser.test.cjs') {
      if (exists(file)) chosen.add(file);
      covered = true;
    }
    if (file.startsWith('tests/') && file.endsWith('.test.cjs') && !file.includes('-browser')) {
      if (exists(file)) chosen.add(file);
      covered = true;
    }
    if (file.startsWith(PILOT) && file.endsWith('.test.cjs')) {
      if (exists(file)) chosen.add(file);
      covered = true;
    }
    const basename = path.posix.basename(file).replace(/\.(?:js|cjs|mjs)$/, '');
    const direct = TEST + basename + '.test.cjs';
    if (exists(direct) && !direct.includes('-browser')) {
      chosen.add(direct);
      covered = true;
    }
    for (const group of groups)
      if (group.match.test(file)) {
        for (const test of group.tests) {
          if (exists(test)) chosen.add(test);
          else missing.add(test);
        }
        covered = true;
      }
    if (!covered) uncovered.push(file);
  }
  // The fallback remains a single lightweight architecture contract, never a suite.
  if (uncovered.length && exists(TEST + 'architecture.test.cjs'))
    chosen.add(TEST + 'architecture.test.cjs');
  return { tests: [...chosen].sort(), uncovered, missing: [...missing].sort() };
}
function diffPaths(base, head = 'HEAD') {
  if (!/^[0-9a-f]{40}$/.test(base || '') || /^0+$/.test(base))
    throw Error('No valid comparison commit for focused CI: refusing an unscoped test run');
  try {
    cp.execFileSync('git', ['cat-file', '-e', base + '^{commit}'], { cwd: root, stdio: 'ignore' });
  } catch {
    cp.execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], {
      cwd: root,
      stdio: 'inherit',
    });
  }
  const bytes = cp.execFileSync(
    'git',
    ['diff', '--name-only', '--no-renames', '-z', base, head, '--'],
    { cwd: root },
  );
  return bytes.toString('utf8').split('\0').filter(Boolean);
}
function run(
  paths,
  invoke = (file) => {
    const pixiBrowser = file === TEST + 'pixi-renderer-browser.test.cjs';
    const result = cp.spawnSync(process.execPath, [path.join(root, file)], {
      cwd: root,
      stdio: 'inherit',
      // A single tested Chromium renderer journey, not the global browser suite.
      env: pixiBrowser
        ? { ...process.env, BROWSER_ENGINE: 'chromium', REQUIRE_WEBGL2: '1' }
        : process.env,
      timeout: pixiBrowser ? 240000 : undefined,
    });
    return result.status === 0;
  },
) {
  const { tests, uncovered, missing } = selectTests(paths);
  if (missing.length) throw Error('Mapped regression tests are missing: ' + missing.join(', '));
  console.log('Changed files: ' + paths.length + '; focused tests: ' + tests.length);
  if (uncovered.length)
    console.warn('::warning::No dedicated test mapping for: ' + uncovered.join(', '));
  let failures = 0;
  for (const file of paths)
    if (/\.(?:js|cjs|mjs)$/.test(file) && fs.existsSync(path.join(root, file))) {
      const result = cp.spawnSync(process.execPath, ['--check', path.join(root, file)], {
        stdio: 'inherit',
      });
      if (result.status !== 0) failures++;
    }
  for (const file of tests) {
    console.log('Focused: ' + file);
    if (!invoke(file)) failures++;
  }
  if (failures) throw Error(failures + ' focused/syntax checks failed');
  console.log(
    'PASS focused validation (' + tests.length + ' relevant test files); no full-game CI',
  );
  return { tests, uncovered };
}
if (require.main === module) {
  try {
    const changed = diffPaths(process.env.CI_BASE_SHA);
    run(changed);
  } catch (error) {
    console.error('::error::' + (error?.message || error));
    process.exitCode = 1;
  }
}
module.exports = { selectTests, diffPaths, run };
