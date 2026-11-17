import { expect, test } from '@playwright/test';

// Each test gets a new context: real IndexedDB writes never touch a user's draft.
test('draft, preview and explicit local apply stay separate across reloads', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/admin');
  await expect(page.getByRole('status')).toContainText('Borrador local cargado.');
  await page.locator('#slot-picker').selectOption('hero.description');
  const original = await page.locator('#content-value').inputValue();
  const updated = 'Contenido de prueba local.';
  const preview = page.frameLocator('iframe');
  await page.locator('#content-value').fill(updated);
  await expect(preview.locator('[data-content-id="hero.description"]')).toHaveText(updated);
  await expect(page.getByRole('status')).toContainText('Borrador guardado');

  const publicPage = await context.newPage();
  await publicPage.goto('/');
  await expect(publicPage.getByText(original, { exact: true })).toBeVisible();
  await expect(publicPage.getByText(updated, { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Borrador local cargado.');
  await page.locator('#slot-picker').selectOption('hero.description');
  await expect(page.locator('#content-value')).toHaveValue(updated);
  await page.getByRole('button', { name: 'Aplicar local', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Aplicado localmente.');
  await expect(publicPage.getByText(updated, { exact: true })).toBeVisible();
  await publicPage.reload();
  await expect(publicPage.getByText(updated, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('preview device widths and local admin theme do not alter the public theme', async ({ page, context }) => {
  await page.goto('/admin');
  await expect(page.getByRole('status')).toContainText('Borrador local cargado.');
  for (const width of [1440, 768, 390, 375, 320]) {
    await page.getByRole('button', { name: `Vista ${width === 1440 ? 'Desktop' : width}`, exact: true }).click();
    await expect(page.locator('iframe')).toHaveCSS('width', `${width}px`);
  }
  const publicPage = await context.newPage();
  await publicPage.goto('/');
  const publicPrimary = await publicPage.locator(':root').evaluate(el => getComputedStyle(el).getPropertyValue('--primary'));
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await page.locator('#theme-primary').fill('#225588');
  await expect(page.locator('.admin-app').first()).toHaveCSS('--primary', '#225588');
  await page.reload();
  await page.getByRole('button', { name: 'Configuración', exact: true }).click();
  await expect(page.locator('#theme-primary')).toHaveValue('#225588');
  expect(await publicPage.locator(':root').evaluate(el => getComputedStyle(el).getPropertyValue('--primary'))).toBe(publicPrimary);
});

test('mobile editor is accessible without document horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Abrir panel de edición', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Panel de edición', exact: true })).toBeVisible();
  await expect(dialog.getByRole('status')).toContainText('Borrador local cargado.');
  await expect(dialog.locator('#content-value')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const mobile of [false, true]) {
  test(`content navigation nests areas and keeps settings at the top level (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin');
    await expect(page.locator('.admin-header')).toContainText('Contenido / Landing');
    const openNavigation = async () => {
      if (mobile) await page.getByRole('button', { name: 'Abrir navegación', exact: true }).click();
      return mobile ? page.getByRole('dialog', { name: 'Navegación', exact: true }) : page.locator('.admin-desktop-nav');
    };
    let navigation = await openNavigation();
    const topItems = navigation.locator('[data-slot="sidebar-menu"] > li');
    await expect(topItems).toHaveCount(2);
    await expect(topItems.nth(0).locator(':scope > button')).toHaveText('Contenido');
    await expect(topItems.nth(1).locator(':scope > button')).toHaveText('Configuración');
    await expect(topItems.nth(0).locator(':scope > button svg').first()).toHaveClass(/lucide-folder-open/);
    const content = navigation.getByRole('button', { name: 'Contenido', exact: true });
    await expect(content).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation.getByRole('button', { name: 'Landing', exact: true })).toHaveCount(0);
    await content.click();
    await expect(content).toHaveAttribute('aria-expanded', 'true');
    await expect(topItems.nth(0).locator('[data-slot="sidebar-menu-sub"] > li')).toHaveText(['Landing', 'Navbar', 'Footer']);
    await expect(navigation.getByRole('button', { name: 'Landing', exact: true })).toBeVisible();
    await content.click();
    await expect(content).toHaveAttribute('aria-expanded', 'false');
    await expect(navigation.getByRole('button', { name: 'Landing', exact: true })).toHaveCount(0);
    await content.click();
    for (const area of ['Navbar', 'Footer', 'Landing']) {
      await navigation.getByRole('button', { name: area, exact: true }).click();
      await expect(page.locator('.admin-header')).toContainText(`Contenido / ${area}`);
      if (!mobile) await expect(page.locator('#slot-picker')).toBeVisible();
      navigation = await openNavigation();
    }
    await navigation.getByRole('button', { name: 'Configuración', exact: true }).click();
    await expect(page.locator('.admin-header')).toContainText('Configuración');
    await expect(page.locator('.admin-header')).not.toContainText('Contenido /');
    await expect(page.locator('#theme-primary')).toBeVisible();
    navigation = await openNavigation();
    await navigation.getByRole('button', { name: 'Contenido', exact: true }).click();
    await expect(page.locator('.admin-header')).toContainText('Contenido / Landing');
    if (!mobile) await expect(page.locator('#slot-picker')).toBeVisible();
  });
}

test('desktop sidebar remains mounted and animates closing and reopening', async ({ page }) => {
  await page.goto('/admin');
  const sidebar = page.locator('.admin-desktop-nav');
  const toggle = page.getByRole('button', { name: 'Alternar navegación', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await sidebar.evaluate(el => getComputedStyle(el).transitionProperty)).toContain('width');
  const expandedWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar).not.toHaveAttribute('inert', '');
  await expect(sidebar).toHaveCSS('width', '56px');
  await expect(sidebar.getByRole('button', { name: 'Contenido', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('button', { name: 'Configuración', exact: true })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Configuración', exact: true }).click();
  await expect(page.locator('#theme-primary')).toBeVisible();
  await expect(sidebar).toHaveCount(1);
  await sidebar.getByRole('button', { name: 'Contenido', exact: true }).click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(sidebar).not.toHaveAttribute('inert', '');
  await expect(sidebar).toHaveCSS('width', `${expandedWidth}px`);
  const content = sidebar.getByRole('button', { name: 'Contenido', exact: true });
  const submenu = sidebar.locator('.admin-content-submenu');
  expect(await submenu.evaluate(el => getComputedStyle(el).transitionProperty)).toContain('grid-template-rows');
  await expect(sidebar.getByRole('button', { name: 'Landing', exact: true })).toBeVisible();
  await content.click();
  await expect(submenu).toHaveAttribute('inert', '');
  await expect(submenu).toHaveCSS('visibility', 'hidden');
});

test('admin omits the local-access notice', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Alternar navegación', exact: true })).toBeVisible();
  await expect(page.getByText('Entorno local sin protección de acceso.', { exact: false })).toHaveCount(0);
});

test('sidebar icons keep their vertical positions when collapsed', async ({ page }) => {
  await page.goto('/admin');
  const sidebar = page.locator('.admin-desktop-nav');
  const toggle = page.getByRole('button', { name: 'Alternar navegación', exact: true });
  const icons = () => Promise.all(['Contenido', 'Configuración', 'Ver sitio web'].map(name =>
    sidebar.getByRole('button', { name, exact: true }).locator('svg').first().evaluate(el => el.getBoundingClientRect().y)));
  for (const submenuOpen of [false, true]) {
    if (submenuOpen) {
      await sidebar.getByRole('button', { name: 'Contenido', exact: true }).click();
      await expect(sidebar.locator('.admin-content-submenu').getByRole('button', { name: 'Footer', exact: true })).toBeVisible();
      await sidebar.locator('.admin-content-submenu').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    }
    const expanded = await icons();
    await toggle.click();
    await expect(sidebar).toHaveCSS('width', '56px');
    const collapsed = await icons();
    collapsed.forEach((y, index) => expect(Math.abs(y - expanded[index])).toBeLessThanOrEqual(1));
    await expect(sidebar.getByRole('button', { name: 'Landing', exact: true })).toHaveCount(0);
    await toggle.click();
    await expect(sidebar).toHaveCSS('width', '256px');
  }
});
