import { expect, test } from '@playwright/test';

test('editor shell follows reference toolbar and selected-element panel structure', async ({ page }) => {
  await page.setViewportSize({ width: 1912, height: 950 });
  await page.goto('/admin');
  await expect(page.getByRole('status')).toContainText('Borrador local cargado.');
  const panel = page.getByRole('complementary', { name: 'Panel de edición' });
  await expect(panel.getByText('TEXTO SELECCIONADO', { exact: true })).toBeVisible();
  await expect(page.locator('.admin-main')).toHaveCSS('margin-top', '8px');
  await expect(panel.locator('.admin-selection-heading')).toHaveCSS('padding', '12px 16px');
  await expect(page.locator('.admin-preview-scroll')).toHaveCSS('padding', '32px');
  await expect(panel.getByRole('combobox', { name: 'Elemento a editar' })).toBeVisible();
  const toolbar = await page.locator('.admin-preview-card > [data-slot="card-header"]').boundingBox();
  const selector = await panel.locator('.admin-selector').boundingBox();
  expect(Math.abs(toolbar!.y - selector!.y)).toBeLessThanOrEqual(1);
  expect(selector!.height).toBe(64);
  await expect(page.getByRole('link', { name: 'Preview de landing', exact: true })).toHaveAttribute('href', '/');
  await page.locator('#slot-picker').selectOption('hero.image');
  await expect(panel.getByText('IMAGEN SELECCIONADA', { exact: true })).toBeVisible();
  await expect(panel.getByRole('region', { name: 'Miniatura de imagen seleccionada' })).toBeVisible();
  await expect(panel.locator('.admin-image-thumbnail')).toHaveCSS('height', '204px');
  await expect(panel.getByRole('button', { name: 'Aplicar local', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/editor-shell-image.png' });
});
