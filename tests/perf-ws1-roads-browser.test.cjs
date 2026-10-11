'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  pw = require(process.env.PLAYWRIGHT_MODULE || 'playwright'),
  Campaign = require('../src/prototype/engine.js');
const root = path.resolve(__dirname, '..'),
  engine = process.env.MATERIAL_BROWSER_ENGINE || 'webkit';
(async () => {
  const browser = await pw[engine].launch(
    engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
      : {},
  );
  try {
    const page = await browser.newPage();
    await page.setContent('<canvas></canvas>');
    await page.addScriptTag({ path: path.join(root, 'src/prototype/rules.js') });
    await page.addScriptTag({ path: path.join(root, 'src/prototype/visuals.js') });
    const reference = fs
      .readFileSync(path.join(__dirname, 'helpers/perf-ws1-roads-baseline.cjs'), 'utf8')
      .replace(
        "const R = require('../../src/prototype/rules.js');",
        'const R = window.PrototypeRules;',
      )
      .replace('module.exports = roads;', 'window.__baselineRoads = roads;');
    await page.addScriptTag({ content: reference });
    const scenes = Campaign.data.regions.map((r, i) => {
      const c = new Campaign();
      c.enter(r.id);
      return { region: i, id: r.id, paths: c.zone().roads };
    });
    const comparisons = await page.evaluate((scenes) => {
      const canvas = document.querySelector('canvas');
      canvas.width = 540;
      canvas.height = 320;
      const ctx = canvas.getContext('2d'),
        results = [];
      for (const { region, id, paths } of scenes)
        for (const scale of [1, 1.5, 2.25, 3.5])
          for (const offset of [0, 17.35]) {
            const draw = (fn) => {
              ctx.resetTransform();
              ctx.clearRect(0, 0, 540, 320);
              ctx.scale(scale, scale);
              fn(
                ctx,
                paths,
                (p) => ({
                  x: 270 / scale + offset + (p.x - p.y) * 0.1,
                  y: -30 + (p.x + p.y) * 0.035,
                }),
                region,
              );
              return ctx.getImageData(0, 0, 540, 320).data;
            };
            const before = draw(window.__baselineRoads),
              after = draw(PrototypeVisuals.roads);
            let max = 0,
              sum = 0;
            for (let i = 0; i < before.length; i++) {
              const d = Math.abs(before[i] - after[i]);
              max = Math.max(max, d);
              sum += d;
            }
            results.push({ id, scale, offset, max, mean: sum / before.length });
          }
      return results;
    }, scenes);
    for (const r of comparisons) assert.equal(r.max, 0, JSON.stringify(r));
    console.log(
      'PASS WS1 ' +
        engine +
        ' ' +
        comparisons.length +
        ' byte-identical road rasters across all regions, zoom/DPR scales and fractional camera translation',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
