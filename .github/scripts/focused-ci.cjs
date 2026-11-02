'use strict';
// Owner policy: ordinary PRs/pushes execute only tests relevant to touched paths.
// Full-game, all-browser and performance matrices are manual-only workflows.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const {
  makeReport,
  renderSummary,
  publishReport,
  extractFailureDetail,
  requiresBehaviorCoverage,
} = require('./focused-ci-report.cjs');
const TEST = 'tests/';
const PILOT = 'tools/webgl-pilot/';
const groups = [
  {
    match: /^src\/prototype\/(?:greenwood|greenwood-landscape)\.js$/,
    tests: [TEST + 'greenwood-flagship.test.cjs', TEST + 'town-street-audit.test.cjs'],
  },
  {
    match: /^src\/prototype\/narration\.js$/,
    tests: [TEST + 'greenwood-interiors.test.cjs'],
  },
  {
    // Ironroot authoring owns Treasury entrances, transport roads and old-save placement.
    // Source-only edits must run native geography and quest/road clearance contracts.
    match: /^src\/prototype\/highlands\.js$/,
    tests: [
      TEST + 'ironroot-highlands.test.cjs',
      TEST + 'local-sites.test.cjs',
      TEST + 'town-street-audit.test.cjs',
    ],
  },
  {
    // #684 isolated design tools must have behavior owners, not architecture fallback.
    match: /^tools\/experimental\/squad-command-planner\.cjs$/,
    tests: [TEST + 'squad-command-planner-dormant.test.cjs'],
  },
  {
    match: /^tools\/legacy\/hero-attack-order\.cjs$/,
    tests: [TEST + 'legacy-hero-order-isolation.test.cjs'],
  },
  {
    match: /^tools\/greenwood-layout\//,
    tests: [TEST + 'greenwood-layout-measurement.test.cjs'],
  }
  {
    match: /^src\/prototype\/world\.js$/,
    tests: [
      TEST + 'greenwood-onboarding-clearance.test.cjs',
      TEST + 'greenwood-scornfang-title.test.cjs',
    ],
  },
  { match: /^\.github\//, tests: [TEST + 'focused-ci-report.test.cjs'] },
  {
    match: /^tests\/helpers\/native-fixture-contracts\.cjs$/,
    tests: [
      TEST + 'native-fixture-contracts.test.cjs',
      TEST + 'ranger-max-range-goblin-response.test.cjs',
      TEST + 'class-passives.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:hero-combat|rules|engine|combat|save|progression|boss-combat)\.js$/,
    tests: [
      TEST + 'class-passives.test.cjs',
      TEST + 'cooldown-only.test.cjs',
      TEST + 'hero-skill1-stage1.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:rules|archive|skill-reference)\.js$/,
    tests: [TEST + 'archive-reference.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:engine|hero-combat|combat|rules)\.js$/,
    tests: [TEST + 'ranger-max-range-goblin-response.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:engine|combat)\.js$/,
    tests: [TEST + 'rogue-anchor-under-fire-integrity.test.cjs'],
  },
  {
    match:
      /^src\/prototype\/(?:renderer|rules|visuals|world|data|sprites)\.js$|^scripts\/sprite-scope-audit\.cjs$/,
    tests: [TEST + 'sprite-scope.test.cjs'],
  },
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
    tests: [
      TEST + 'charge-interruption.test.cjs',
      TEST + 'pet-skill-activation.test.cjs',
      TEST + 'pet-skill-priority.test.cjs',
    ],
  },
  {
    // Keep the owner's merged Rogue stacking contract in every future
    // combat/party/journal regression, not only when its test file is edited.
    match: /^src\/prototype\/(?:hero-combat|party|skill-reference)\.js$/,
    tests: [
      TEST + 'rogue-all-skills-stacking.test.cjs',
      TEST + 'rogue-bard-critical-performances.test.cjs',
      TEST + 'rogue-self-centered-performances.test.cjs',
    ],
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
      TEST + 'pixi-parity.test.cjs',
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
    tests: [
      TEST + 'world-proportions.test.cjs',
      TEST + 'sprites.test.cjs',
      TEST + 'pixi-parity.test.cjs',
    ],
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
      TEST + 'vale-periodic-route-regression.test.cjs',
      TEST + 'snapshot-thorn-patrol.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:field-onboarding|engine)\.js$|^tests\/helpers\/field-opening\.cjs$/,
    tests: [
      TEST + 'night-tempo.test.cjs',
      TEST + 'field-onboarding.test.cjs',
      TEST + 'ranged-pet-support.test.cjs',
      TEST + 'enemy-support-healing.test.cjs',
      TEST + 'enemy-ordinary-heal-balance.test.cjs',
      TEST + 'enemy-cross-species-idle-healing.test.cjs',
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
      TEST + 'enemy-ordinary-heal-balance.test.cjs',
      TEST + 'enemy-cross-species-idle-healing.test.cjs',
    ],
  },
  {
    match: /^src\/prototype\/(?:rules|save|boss-combat)\.js$/,
    tests: [TEST + 'snapshot-encounter-lifecycle.test.cjs'],
  },
  {
    // A rules edit can alter the source fingerprints in the sprite census.
    // Validate its checked-in evidence even when the graphics stay identical.
    match: /^src\/prototype\/rules\.js$|^docs\/evidence\/SPRITE_SCOPE_RECONCILIATION\.json$/,
    tests: [TEST + 'sprite-scope.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:combat|boss-combat|fortifications)\.js$/,
    tests: [TEST + 'projectile-order.test.cjs'],
  },
  {
    // Native garrison wall-lane audit belongs to focused combat geometry checks.
    match: /^tools\/native-fort-audit-dev145\/positive-lanes\.cjs$/,
    tests: [TEST + 'fortifications.test.cjs', TEST + 'treasury-fortifications.test.cjs'],
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
    // The four-source importer updates actual game sound registration,
    // provenance, 19 location routes and generated offline references.
    // Every future change to this one-off source must retain real tests.
    match: /^tools\/audio\/integrate-regional-candidates\.cjs$/,
    tests: [TEST + 'audio-catalog.test.cjs', TEST + 'environment-audio-inventory.test.cjs'],
  },
  {
    // #727 Stage 2–6 source ledgers are the production truth for the isolated
    // preview importer; its own source preflight must not fall through to a
    // generic architecture test.
    match: /^tools\/audio\/(?:environment-727-(?:stage6-lab\.cjs|(?:outdoor-studies|outdoor-expansion|dungeon-studies|side-interiors|treasury-studies|production-routing)\.json)|frozen-preview\/(?:study|studio)-[a-z0-9-]+-727\.mp3)$/,
    tests: [TEST + 'environment-727-stage6-source.test.cjs'],
  },
  {
    // #727 playable Sound Library entry HTML is a first-class audio player,
    // not unrelated architecture. Native browser playback stays separately gated.
    match: /^tools\/audio\/index\.html$/,
    tests: [TEST + 'audio-catalog.test.cjs', TEST + 'environment-727-stage6-source.test.cjs'],
  },
  {
    // #727 Stage 7 offline owner-audition scripts and template are source:
    // a syntax/content-focused preflight must own each changed path.
    match: /^tools\/audio\/environment-727-audition(?:-pack\.cjs|\/(?:player\.js|index\.html))$/,
    tests: [TEST + 'environment-727-stage6-source.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:audio[^/]*\.js)$|^assets\/audio\//,
    tests: [TEST + 'audio-catalog.test.cjs', TEST + 'audio-scheduler.test.cjs'],
  },
  {
    match: /^src\/prototype\/(?:sprites|sprite-format)\.js$|^assets\/sprites\/|^tools\/sprites\//,
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
  {
    // Individual mastery and Orin training touch authoritative quest payment,
    // levels, actual deaths, barracks recovery, companion skills and v4 saves.
    // Keep their regression suite selected whenever any of those change.
    match:
      /^src\/prototype\/(?:rewards|progression|party|party-pets|engine|rules|save|menus|hero-combat)\.js$/,
    tests: [
      TEST + 'companion-mastery-rewards.test.cjs',
      TEST + 'charmed-ringleader-training.test.cjs',
    ],
  },
  {
    // Phase 4 must be retested when any source owning capture, creature growth,
    // work orders, company operations, save or shared species artwork changes.
    match:
      /^src\/prototype\/(?:party|progression|hero-combat|save|engine|rules|combat|menus|visuals|sprites)\.js$/,
    tests: [TEST + 'rogue-bard-phase4-companions.test.cjs'],
  },
  {
    // New song code, timing owners and card metadata must preserve mirrored
    // effects, old-class isolation and short-lived nonstacking party boons.
    match: /^src\/prototype\/(?:hero-combat|combat|party|rules|save|skill-reference)\.js$/,
    tests: [
      TEST + 'rogue-bard-phase5-repertoire.test.cjs',
      TEST + 'rogue-bard-critical-skill1.test.cjs',
    ],
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
    missing = new Set(),
    manualBrowser = [];
  for (const file of changed) {
    if (!relevant(file) || !eligible(file)) continue;
    let covered = false;
    // One explicitly changed Pixi acceptance test may run as a focused
    // browser smoke. Never select an entire browser matrix by subsystem.
    if (
      file === TEST + 'pixi-renderer-browser.test.cjs' ||
      file === TEST + 'pixi-renderer-phone-browser.test.cjs' ||
      file === TEST + 'environment-atmosphere-browser.test.cjs' ||
      file === TEST + 'status-renderer-browser.test.cjs' ||
      file === TEST + 'frame-rate-browser.test.cjs' ||
      file === TEST + 'effect-diagnostics-stage5-browser.test.cjs'
    ) {
      // Two explicit narrow Chromium acceptance files; never a browser matrix.
      if (exists(file)) chosen.add(file);
      covered = true;
    }
    if (file.startsWith('tests/') && file.endsWith('-browser.test.cjs') && !covered) {
      manualBrowser.push(file);
      covered = true; // Deferred to owner-approved browser acceptance, not architecture coverage.
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
  return { tests: [...chosen].sort(), uncovered, missing: [...missing].sort(), manualBrowser };
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
    const pixiBrowser =
      file === TEST + 'pixi-renderer-browser.test.cjs' ||
      file === TEST + 'pixi-renderer-phone-browser.test.cjs';
    const statusBrowser = file === TEST + 'status-renderer-browser.test.cjs';
    const narrowBrowser =
      pixiBrowser ||
      statusBrowser ||
      file === TEST + 'environment-atmosphere-browser.test.cjs' ||
      file === TEST + 'frame-rate-browser.test.cjs' ||
      file === TEST + 'effect-diagnostics-stage5-browser.test.cjs';
    const result = cp.spawnSync(process.execPath, [path.join(root, file)], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
      // Explicit narrow Chromium smoke only; never expand to a full matrix.
      env: narrowBrowser
        ? {
            ...process.env,
            BROWSER_ENGINE: 'chromium',
            ...(pixiBrowser
              ? {
                  PIXI_BROWSER_DEVICE:
                    file === TEST + 'pixi-renderer-phone-browser.test.cjs' ? 'phone' : 'desktop',
                }
              : {}),
            ...(pixiBrowser || statusBrowser ? { REQUIRE_WEBGL2: '1' } : {}),
          }
        : process.env,
      // The owner-approved full-current-region Pixi smoke is readiness-driven,
      // not bounded by the older 4-minute fringe-preload assumption. Preserve
      // the test and its failure reporting with a longer runner ceiling.
      timeout: statusBrowser ? 660000 : pixiBrowser ? 360000 : narrowBrowser ? 240000 : undefined,
    });
    // Replay the full original stdout/stderr in CI; also retain a short
    // actionable first error for the structured report.
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    const ok = result.status === 0 && !result.error;
    return {
      ok,
      status: result.status,
      signal: result.signal,
      error:
        result.error?.message || (!ok ? extractFailureDetail(result.stderr, result.stdout) : null),
    };
  },
) {
  const startedAt = new Date().toISOString();
  const { tests, uncovered, missing, manualBrowser } = selectTests(paths);
  const sourceGaps = uncovered.filter(requiresBehaviorCoverage);
  let testedSha = process.env.GITHUB_SHA || null;
  try {
    testedSha = cp
      .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
      .trim();
  } catch {
    // Preserve environment ref or state explicitly unknown.
  }
  console.log(
    'Focused candidate: ' +
      (testedSha || 'unknown') +
      '; base: ' +
      (process.env.CI_BASE_SHA || 'unknown'),
  );
  console.log('Changed files: ' + paths.length + '; focused tests: ' + tests.length);
  if (missing.length)
    console.error('::error::Mapped regression tests are missing: ' + missing.join(', '));
  if (uncovered.length)
    console.warn(
      '::warning::No dedicated test mapping for: ' +
        uncovered.join(', ') +
        '; architecture fallback is not behavioral validation',
    );
  if (sourceGaps.length)
    console.error(
      '::error::Uncovered changed source requires focused test ownership: ' + sourceGaps.join(', '),
    );
  for (const file of manualBrowser)
    console.warn('::warning::Manual browser acceptance not run under ordinary CI: ' + file);
  const checks = [];
  // This source is a build template with {{PLACEHOLDER}} tokens, not runnable JS.
  // Its generated sw.js is syntax-checked separately and by the build check.
  for (const file of paths)
    if (
      file !== 'templates/service-worker.js' &&
      /\.(?:js|cjs|mjs)$/.test(file) &&
      fs.existsSync(path.join(root, file))
    ) {
      const began = Date.now();
      const result = cp.spawnSync(process.execPath, ['--check', path.join(root, file)], {
        stdio: 'inherit',
      });
      const ok = result.status === 0 && !result.error;
      checks.push({
        file,
        kind: 'syntax',
        ok,
        status: result.status,
        signal: result.signal,
        error: result.error?.message || null,
        durationMs: Date.now() - began,
      });
      if (!ok) console.error('::error::Syntax/launch failure: ' + file);
    }
  for (const file of tests) {
    console.log('Focused: ' + file);
    const began = Date.now();
    let outcome;
    try {
      outcome = invoke(file);
    } catch (error) {
      outcome = { ok: false, status: null, error: error?.message || String(error) };
    }
    const detail =
      typeof outcome === 'boolean' ? { ok: outcome, status: outcome ? 0 : 1 } : outcome;
    const ok = !!detail?.ok;
    checks.push({
      file,
      kind: 'test',
      ok,
      status: detail?.status ?? null,
      signal: detail?.signal || null,
      error: detail?.error || null,
      durationMs: Date.now() - began,
    });
    if (!ok)
      console.error(
        '::error::Focused test failed: ' + file + ' (exit ' + (detail?.status ?? 'unknown') + ')',
      );
  }
  const report = makeReport({
    testedSha,
    baseSha: process.env.CI_BASE_SHA || null,
    paths,
    selected: tests,
    uncovered,
    missing,
    manualBrowser,
    checks,
    startedAt,
    finishedAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
  });
  publishReport(report);
  console.log(renderSummary(report));
  if (report.result === 'failure')
    throw Error(
      checks.filter((check) => !check.ok).length +
        ' focused/syntax checks failed' +
        (sourceGaps.length ? '; ' + sourceGaps.length + ' uncovered source paths' : '') +
        (missing.length ? '; ' + missing.length + ' missing mapped tests' : ''),
    );
  console.log(
    'PASS focused validation (' +
      tests.length +
      ' relevant test files); no full-game CI; manual browser suites separately gated',
  );
  return { tests, uncovered, manualBrowser, report };
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
