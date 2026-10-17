'use strict';

// Follow the public language choice before the existing new-game steps.
// Historical release fixtures predate this screen and keep their original path.
exports.selectEnglish = async function (page) {
  await page.waitForFunction(() => !!window.Prototype);
  const title = await page.locator('#modal-title').textContent();
  if (title !== 'Choose your language' && title !== 'Elige tu idioma') return;
  await page.getByRole('button', { name: /^English(?: ✓)?$/ }).click();
};
