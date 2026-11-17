import { expect, test } from '@playwright/test';

test('selected image thumbnail follows alt edits and library selection', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('status')).toContainText('Borrador local cargado.');
  await page.locator('#slot-picker').selectOption('hero.image');
  const thumbnail = page.getByRole('region', { name: 'Miniatura de imagen seleccionada' }).locator('img');
  await expect(thumbnail).toHaveAttribute('src', '/hero-lisi.png');
  await expect(thumbnail).toHaveAttribute('alt', 'Retrato de Lisi González');
  await expect(thumbnail).toBeVisible();
  await expect.poll(() => thumbnail.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await page.locator('#image-alt').fill('Retrato editado');
  await expect(thumbnail).toHaveAttribute('alt', 'Retrato editado');
  await page.getByRole('button', { name: 'Elegir de Lisi', exact: true }).click();
  const replacement = page.locator('.admin-library-item').nth(1);
  const name = (await replacement.getAttribute('aria-label'))!.replace(/^Elegir /, '');
  await replacement.click();
  await expect(thumbnail).not.toHaveAttribute('src', '/hero-lisi.png');
  await expect(thumbnail).toHaveAttribute('alt', name);
  await expect(thumbnail).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bordes redondeados' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ajustar', exact: true })).toBeVisible();
});
