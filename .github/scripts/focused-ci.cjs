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
  { match: /(?:^|\/)(?:pixi-experimental\.js|pixi-scene-bridge\.js|native-sprite-adapter\.js|renderer-switch-guard\.js|native-webgl2-core\.js)$|^tests\/pixi-|^tools\/webgl-pilot\//,
    tests: [TEST+'pixi-fidelity.test.cjs', TEST+'pixi-step3-source.test.cjs',
      PILOT+'pixi-scene-bridge.test.cjs', PILOT+'renderer-switch-guard.test.cjs'] },
  { match: /^src\/prototype\/renderer\.js$/, tests: [
    TEST+'occlusion.test.cjs',TEST+'terrain-effects.test.cjs',TEST+'pixi-fidelity.test.cjs'] },
  { match: /^src\/prototype\/(?:visuals|hero-presentation)\.js$/, tests: [
    TEST+'world-proportions.test.cjs',TEST+'sprites.test.cjs'] },
  { match: /^src\/prototype\/engine\.js$|^src\/game\.js$/, tests: [
    TEST+'game.test.cjs',TEST+'daylight-cycle.test.cjs'] },
  { match: /^src\/prototype\/(?:app|menus)\.js$/, tests: [
    TEST+'app.test.cjs',TEST+'game-menu-ui.test.cjs'] },
  { match: /^src\/prototype\/(?:platform|runtime|frame-rate)\.js$/, tests: [
    TEST+'platform-runtime.test.cjs',TEST+'frame-rate.test.cjs'] },
  { match: /^src\/prototype\/(?:audio[^/]*\.js)$|^assets\/audio\//, tests: [
    TEST+'audio-catalog.test.cjs',TEST+'audio-scheduler.test.cjs'] },
  { match: /^src\/prototype\/sprites\.js$|^assets\/sprites\/|^tools\/sprites\//, tests: [
    TEST+'sprites.test.cjs',TEST+'sprite-lifecycle.test.cjs'] },
  { match: /^src\/prototype\/(?:materials|ground-cache)\.js$|^assets\/materials\//, tests: [
    TEST+'materials.test.cjs',TEST+'ground-cache.test.cjs'] },
  { match: /^src\/prototype\/input\.js$/, tests: [TEST+'input.test.cjs'] },
  { match: /^src\/prototype\/.*(?:combat|enemy|pet|skills).*\.js$/, tests: [
    TEST+'combat-conditions.test.cjs',TEST+'pet-skill-effects.test.cjs'] },
  { match: /^\.github\//, tests: [
    TEST+'ci-focus-policy.test.cjs',TEST+'ci-scope.test.cjs'] },
  { match: /^scripts\/(?:build|site-assets|vendor-pixi)\.(?:cjs|js)$|^templates\//, tests: [
    TEST+'asset-packaging.test.cjs'] },
];
const eligible = (file) => /\.(?:js|cjs|mjs|json|css|html|webp|png|svg|mp3|ogg|yml|yaml)$/.test(file);
const relevant = (file) => file.startsWith('src/') || file.startsWith('tools/') ||
  file.startsWith('scripts/') || file.startsWith('assets/') || file.startsWith('tests/') ||
  file.startsWith('templates/') || file.startsWith('.github/') ||
  ['package.json','package-lock.json','index.html','phone.html','prototype.html','sw.js'].includes(file);
function selectTests(changed, exists = (file) => fs.existsSync(path.join(root,file))) {
  const chosen = new Set(), uncovered = [];
  for (const file of changed) {
    if (!relevant(file) || !eligible(file)) continue;
    let covered = false;
    // One explicitly changed Pixi acceptance test may run as a focused
    // browser smoke. Never select an entire browser matrix by subsystem.
    if (file === TEST+'pixi-renderer-browser.test.cjs') {
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
    const basename = path.posix.basename(file).replace(/\.(?:js|cjs|mjs)$/,'');
    const direct = TEST + basename + '.test.cjs';
    if (exists(direct) && !direct.includes('-browser')) {
      chosen.add(direct); covered = true;
    }
    for (const group of groups) if (group.match.test(file)) {
      for (const test of group.tests) if (exists(test)) chosen.add(test);
      covered = true;
    }
    if (!covered) uncovered.push(file);
  }
  // The fallback remains a single lightweight architecture contract, never a suite.
  if (uncovered.length && exists(TEST+'architecture.test.cjs'))
    chosen.add(TEST+'architecture.test.cjs');
  return {tests: [...chosen].sort(), uncovered};
}
function diffPaths(base, head = 'HEAD') {
  if (!/^[0-9a-f]{40}$/.test(base || '') || /^0+$/.test(base))
    throw Error('No valid comparison commit for focused CI: refusing an unscoped test run');
  try {
    cp.execFileSync('git',['cat-file','-e',base+'^{commit}'],{cwd:root,stdio:'ignore'});
  } catch {
    cp.execFileSync('git',['fetch','--no-tags','--depth=1','origin',base],{cwd:root,stdio:'inherit'});
  }
  const bytes = cp.execFileSync('git',['diff','--name-only','--no-renames','-z',base,head,'--'],
    {cwd:root});
  return bytes.toString('utf8').split('\0').filter(Boolean);
}
function run(paths, invoke = (file) => {
  const pixiBrowser = file === TEST+'pixi-renderer-browser.test.cjs';
  const result = cp.spawnSync(process.execPath,[path.join(root,file)],{
    cwd:root,stdio:'inherit',
    // A single tested Chromium renderer journey, not the global browser suite.
    env:pixiBrowser?{...process.env,BROWSER_ENGINE:'chromium',REQUIRE_WEBGL2:'1'}:process.env,
    timeout:pixiBrowser?240000:undefined
  });
  return result.status === 0;
}) {
  const {tests,uncovered} = selectTests(paths);
  console.log('Changed files: '+paths.length+'; focused tests: '+tests.length);
  if (uncovered.length) console.warn('::warning::No dedicated test mapping for: '+uncovered.join(', '));
  let failures = 0;
  for(const file of paths) if (/\.(?:js|cjs|mjs)$/.test(file) &&
      fs.existsSync(path.join(root,file))) {
    const result = cp.spawnSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});
    if(result.status!==0)failures++;
  }
  for(const file of tests) {
    console.log('Focused: '+file);
    if(!invoke(file))failures++;
  }
  if(failures)throw Error(failures+' focused/syntax checks failed');
  console.log('PASS focused validation ('+tests.length+' relevant test files); no full-game CI');
  return {tests,uncovered};
}
if(require.main===module) {
  try {
    const changed=diffPaths(process.env.CI_BASE_SHA);
    run(changed);
  } catch(error) {
    console.error('::error::'+(error?.message||error));process.exitCode=1;
  }
}
module.exports={selectTests,diffPaths,run};
