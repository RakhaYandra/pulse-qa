import { test, expect } from '@playwright/test';

const EMAIL = `e2e${Date.now()}@pulse.local`;
const PASS = 'e2e12345';

test.beforeEach(async ({ page }) => {
  const email = `e2e${Date.now()}${Math.floor(Math.random() * 1e6)}@pulse.local`;
  await page.goto('/');
  await page.getByRole('button', { name: /register/i }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel(/Password/).fill(PASS);
  await page.getByLabel('Display name').fill('E2E');
  await page.getByRole('button', { name: /^register$/i }).click();
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
  await row.getByRole('button', { name: 'Pause' }).click();
  await expect(row.getByText('PAUSED')).toBeVisible({ timeout: 5000 });
});

test('click incident opens its monitor', async ({ page }) => {
  test.setTimeout(180000);
  const name = 'E2E Incident ' + Date.now();
  await page.getByRole('button', { name: '+ New' }).click();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('URL').fill('https://example.com/does-not-exist-404');
  await page.getByLabel(/Interval/).fill('60');
  await page.getByRole('button', { name: 'Create monitor' }).click();
  await page.getByRole('button', { name: 'Monitors' }).click();
  // failure_threshold defaults to 3: wait for 3 failed 60s-interval checks
  await page.getByRole('button', { name: 'Incidents (0)' }).click();
  await expect(page.locator('.row', { hasText: name })).toBeVisible({ timeout: 170000 });
  await page.locator('.row', { hasText: name }).first().click();
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
