const fs = require('fs'),
  path = require('path'),
  { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    ...(process.env.ART_REVIEW_CHROMIUM ? { executablePath: process.env.ART_REVIEW_CHROMIUM } : {}),
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--single-process'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.join(__dirname, 'approved-art-pass/Procedural_Art_Review.html'));
  await page.waitForSelector('.card');
  await page
    .locator('.card img')
    .first()
    .evaluate((im) => im.decode());
  const all = await page.locator('#showing').textContent();
  if (!all.includes('513')) throw Error('missing full catalog count');
  const data = await page.evaluate(() => JSON.parse(document.getElementById('data').textContent));
  if (data.cases.length !== 513 || data.cases.reduce((n, r) => n + r.afterImages.length, 0) !== 621)
    throw Error('incomplete pairs');
  if (!data.cases.every((r) => r.images.length === r.afterImages.length))
    throw Error('unpaired variants');
  await page.locator('#query').fill('crowned:mage');
  if ((await page.locator('.card').count()) !== 1) throw Error('search count');
  const found = await page.locator('.card h2').textContent();
  if (found !== 'Crowned Mage') throw Error('wrong named search result');
  await page.locator('.card select').selectOption('approve');
  await page.locator('.card textarea').fill('Verification note');
  await page.reload();
  await page.locator('#query').fill('crowned:mage');
  if ((await page.locator('.card select').inputValue()) !== 'approve')
    throw Error('decision not retained');
  if ((await page.locator('.card textarea').inputValue()) !== 'Verification note')
    throw Error('note not retained');
  const download = page.waitForEvent('download');
  await page.locator('#export').click();
  const d = await download;
  const json = JSON.parse(fs.readFileSync(await d.path(), 'utf8'));
  if (!json.decisions.some((d) => d.id === 'crowned:mage' && d.choice === 'approve'))
    throw Error('bad decision export');
  if (!json.bulkPlanApproval || !json.afterSource) throw Error('missing approval or source');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#query').fill('raider:frontier');
  await page.locator('.card img').first().click();
  await page.waitForSelector('dialog[open]');
  await page.locator('#close').click();
  await page.locator('#query').fill('');
  await page.locator('#mode').click();
  if ((await page.locator('.card').count()) !== 1) throw Error('one-at-a-time');
  await page.locator('#next').click();
  if (!(await page.locator('.card .num').textContent()).startsWith('002'))
    throw Error('next failed');
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw Error('phone horizontal overflow');
  await page.locator('#category').selectOption('crown-troop');
  await page.locator('#mode').click();
  await page
    .locator('.card img')
    .first()
    .evaluate((im) => im.decode());
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.locator('#native summary').click();
  await page.waitForSelector('#nativeGrid img', { state: 'attached' });
  await page.locator('#nativeGrid img').evaluateAll(async (images) => {
    images.forEach((im) => (im.loading = 'eager'));
    await Promise.all(images.map((im) => im.decode()));
  });
  if ((await page.locator('#nativeGrid img').count()) !== 36) throw Error('native context count');
  await page
    .locator('#nativeGrid img')
    .first()
    .evaluate((i) => i.decode());
  if (errors.length) throw Error(errors.join('\n'));
  await browser.close();
  console.log(
    JSON.stringify({
      entries: 513,
      search: 'pass',
      decisions: 'retained and exported',
      imageEnlargement: 'pass',
      oneAtATime: 'pass',
      phoneOverflow: false,
      scriptErrors: errors,
      gameTestsRun: false,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
