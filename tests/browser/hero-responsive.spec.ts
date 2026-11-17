import { expect, test, type Locator } from '@playwright/test';

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

for (const width of [320, 375, 430, 760]) {
  test(`mobile hero centers its presentation above the photo at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const copy = await bounds(page.locator('.hero-copy'));
    const photo = await bounds(page.locator('.hero-visual'));
    expect(copy.y + copy.height).toBeLessThanOrEqual(photo.y + 1);
    for (const selector of ['.hero-copy-inner', '.hero-logo', '.hero-lede', '.hero-actions']) {
      const box = await bounds(page.locator(selector));
      expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThanOrEqual(1);
    }
    await expect(page.locator('.hero-lede')).toHaveCSS('text-align', 'center');
    await expect(page.locator('.hero-actions')).toHaveCSS('justify-content', 'center');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

test('desktop hero keeps the photo on the left and presentation on the right', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const copy = await bounds(page.locator('.hero-copy'));
  const photo = await bounds(page.locator('.hero-visual'));
  expect(photo.x + photo.width).toBeLessThanOrEqual(copy.x + 1);
  expect(copy.y).toBe(photo.y);
  await expect(page.locator('.hero-lede')).toHaveCSS('text-align', 'start');
});
