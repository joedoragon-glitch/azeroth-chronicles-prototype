'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  { chromium, webkit } = require('playwright');
const source = fs.readFileSync('src/prototype/visuals.js', 'utf8');
const code = source.slice(
  source.indexOf('  function atmosphere('),
  source.indexOf('  function enemyBodyKind('),
);
(async () => {
  const type = process.env.SCAN_WEBKIT ? webkit : chromium;
  const browser = await type.launch(
    process.env.SCAN_WEBKIT
      ? {}
      : {
          executablePath: process.env.CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        },
  );
  try {
    const p = await browser.newPage({
      viewport: { width: 844, height: 390 },
      isMobile: true,
      hasTouch: true,
    });
    await p.setContent('<canvas width="240" height="160"></canvas>');
    await p.addScriptTag({ content: code + ';window.paintAtmosphere=atmosphere;' });
    const result = await p.evaluate(() => {
      const canvas = document.querySelector('canvas'),
        ctx = canvas.getContext('2d'),
        reports = [];
      for (const phase of ['sunrise', 'sunset', 'victory-sunrise']) {
        let last = null,
          maxJump = 0,
          maxMeanJump = 0,
          jumpAt = 0,
          whiteFrames = 0;
        for (let step = 0; step <= 600; step++) {
          const progress = step / 600,
            smooth = progress * progress * (3 - 2 * progress),
            darkness = phase === 'sunset' ? smooth : 1 - smooth;
          ctx.fillStyle = '#70826a';
          ctx.fillRect(0, 0, 240, 160);
          paintAtmosphere(ctx, canvas, 0, {
            night: phase !== 'sunset',
            peace: phase === 'victory-sunrise',
            hero: { x: 120, y: 100 },
            lights: [{ x: 100, y: 100, kind: 'window' }],
            daylight: { phase, progress, darkness, warmth: Math.sin(Math.PI * progress) },
          });
          const pixels = ctx.getImageData(0, 0, 240, 160).data;
          let meanDelta = 0,
            white = 0;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 235 && pixels[i + 1] > 235 && pixels[i + 2] > 235) white++;
            if (last)
              for (let c = 0; c < 3; c++) {
                const d = Math.abs(pixels[i + c] - last[i + c]);
                meanDelta += d;
                if (d > maxJump) {
                  maxJump = d;
                  jumpAt = progress;
                }
              }
          }
          if (white > 240 * 160 * 0.05) whiteFrames++;
          maxMeanJump = Math.max(maxMeanJump, meanDelta / (240 * 160 * 3));
          last = pixels;
        }
        reports.push({ phase, maxJump, maxMeanJump, jumpAt, whiteFrames });
      }
      return reports;
    });
    for (const row of result) {
      assert.equal(row.whiteFrames, 0);
      assert(row.maxMeanJump < 1.5, 'bounded consecutive-frame brightness');
    }
    const report = { engine: type.name(), framesPerTransition: 601, reports: result };
    fs.writeFileSync(
      __dirname + '/scan-' + type.name() + '.json',
      JSON.stringify(report, null, 2) + '\n',
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
