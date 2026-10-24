import { test, expect, USER } from './fixtures.js'

test('the movies page shows the seeded collection with only the app reachable', async ({ page }) => {
  const blocked = []
  const requested = []
  page.on('request', (request) => requested.push(new URL(request.url()).host))
  page.on('requestfailed', (request) => blocked.push(new URL(request.url()).host))

  await page.goto(`/users/${USER.id}`)

  await expect(page.locator('#movie-list > .index-preview')).toHaveCount(30)
  await expect(page.locator('#movie-list .truncate', { hasText: 'Amber' })).toBeVisible()
  expect(await page.evaluate(() => typeof window.jQuery)).toBe('undefined')
  expect(requested).not.toContain('ajax.googleapis.com')
  expect(blocked).toContain('www.googletagmanager.com')
})
