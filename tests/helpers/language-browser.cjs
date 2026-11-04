'use strict';

// Follow the public language choice before the existing new-game steps.
// Historical release fixtures predate this screen and keep their original path.
exports.selectEnglish = async function (page) {
  await page.waitForFunction(() => !!window.Prototype);
  const welcome = page.locator('#language-welcome');
  if (await welcome.count()) {
    // Automatic startup updates finish before the one-time welcome is shown.
    await page.waitForFunction(() => document.querySelector('#startup-update')?.hidden);
    if (await welcome.isVisible()) {
      await welcome.locator('[data-language="en"]').click();
      return;
    }
  }
  // Preserve compatibility with older pre-welcome browser fixtures.
  const title = await page.locator('#modal-title').textContent();
  if (title !== 'Choose your language' && title !== 'Elige tu idioma') return;
  await page.getByRole('button', { name: /^English(?: ✓)?$/ }).click();
};
