import { test, expect } from '@playwright/test';

const EMAIL = `e2e${Date.now()}@pulse.local`;
const PASS = 'e2e12345';

test.beforeEach(async ({ page }) => {
  const email = `e2e${Date.now()}${Math.floor(Math.random() * 1e6)}@pulse.local`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Register', exact: true }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/Password/).fill(PASS);
  await page.getByLabel('Display name').fill('E2E');
  await page.getByRole('button', { name: 'Enter ops deck' }).click();
  await expect(page.getByText('monitors', { exact: false }).first()).toBeVisible({ timeout: 10000 });
});

test('dashboard shows summary stats', async ({ page }) => {
  await expect(page.getByText('uptime 24h')).toBeVisible();
});

test('create monitor appears in list', async ({ page }) => {
  const name = 'E2E Monitor ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Monitors' }).click();
  await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
});

test('create monitor rejects bad url', async ({ page }) => {
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Bad');
  await page.getByLabel('URL').fill('http://localhost:9/x');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await expect(page.getByText(/not allowed|valid http/i)).toBeVisible({ timeout: 5000 });
});

test('monitor detail shows checks table', async ({ page }) => {
  const name = 'E2E Detail ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Monitors' }).click();
  await page.getByText(name).click();
  await expect(page.getByText('Recent checks')).toBeVisible({ timeout: 10000 });
});

test('pause flips monitor to paused', async ({ page }) => {
  const name = 'E2E Pause ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Monitors' }).click();
  const row = page.locator('.row', { hasText: name });
  await row.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(row.locator('span.muted', { hasText: 'PAUSED' })).toBeVisible({ timeout: 5000 });
});

test('click incident opens its monitor', async ({ page }) => {
  test.setTimeout(180000);
  const name = 'E2E Incident ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com/does-not-exist-404');
  await page.getByLabel(/Interval/).fill('60');
  await page.getByLabel(/Failure threshold/).fill('1');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Monitors' }).click();
  // failure_threshold defaults to 3: wait for 3 failed 60s-interval checks
  await page.getByRole('button', { name: 'Incidents (0)' }).click();
  await expect(page.locator('.row', { hasText: name })).toBeVisible({ timeout: 170000 });
  await page.getByRole('link', { name: `Open monitor ${name}` }).click();
  await expect(page.getByText('Recent checks')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(name).first()).toBeVisible();
}, 180000);

test('reports tab renders reliability table', async ({ page }) => {
  const name = 'E2E Report ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Reports' }).click();
  await expect(page.getByText('Per-monitor reliability')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('columnheader', { name: 'MTTR' })).toBeVisible();
  await expect(page.getByText(name)).toBeVisible();
});

test('theme toggle persists across reload', async ({ page }) => {
  const initial = await page.evaluate(() => document.documentElement.dataset.theme);
  const next = initial === 'dark' ? 'light' : 'dark';
  await page.getByRole('button', { name: /switch to (light|dark) mode/i }).click();
  await expect(page.locator(`html[data-theme="${next}"]`)).toHaveCount(1);
  await page.reload();
  await expect(page.locator(`html[data-theme="${next}"]`)).toHaveCount(1);
  await expect(page.getByText('uptime 24h').first()).toBeVisible({ timeout: 10000 });
});

test('monitor detail deep-links and back returns', async ({ page }) => {
  const name = 'E2E DeepLink ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Monitors' }).click();
  const href = await page.getByRole('link', { name: `Open ${name}` }).getAttribute('href');
  await page.goto(href);
  await expect(page.getByText('Recent checks')).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/monitors\/.+/);
  await page.getByRole('button', { name: /back/i }).click();
  await expect(page.getByText('uptime 24h').first()).toBeVisible({ timeout: 10000 });
});

test('reports range switch changes days param', async ({ page }) => {
  const name = 'E2E Range ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Reports' }).click();
  await expect(page.getByText('Per-monitor reliability')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: '90d', exact: true }).click();
  await expect(page).toHaveURL(/days=90/);
  await expect(page.getByText('last 90 days')).toBeVisible({ timeout: 10000 });
});
