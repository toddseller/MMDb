import { readFileSync } from 'node:fs'
import { test, expect, USER, reseed, signIn } from './fixtures.js'

// Written by the seed from the real routes and partials, with Apple and TMDB replaced by canned results.
const recorded = (name) => readFileSync(new URL(`./.generated/${name}.json`, import.meta.url), 'utf8')
const showPoster = (page) => page.locator('#show-list img[alt="Harbor Lights Poster"]')

test.afterAll(reseed)

test.beforeEach(async ({ page }) => {
  await signIn(page)
  await page.goto(`/users/${USER.id}/shows`)
  await expect(showPoster(page)).toBeVisible()
})

test('adding an episode from a show search lists it under its season', async ({ page }) => {
  await page.route('**/shows?query=*', (route) => route.fulfill({ body: recorded('show_search'), contentType: 'application/json' }))
  await page.route(`**/users/${USER.id}/shows`, (route) =>
    route.request().method() === 'POST' ? route.fulfill({ body: recorded('show_episodes'), contentType: 'application/json' }) : route.fallback())

  await page.getByRole('button', { name: 'Add TV Show' }).click()
  await page.getByPlaceholder('TV Show Title').fill('harbor')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('button', { name: 'Harbor Lights Poster' }).click()
  // The episode's button is its preview image, which has no text; the form around it names the episode.
  await page.locator('form', { hasText: 'Harbor Lights 1x2' }).getByRole('button').click()

  // Without the page's script the form would still post, but the browser would leave the shows page.
  await expect(page.getByText('Harbor Lights 1x2', { exact: true })).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`/users/${USER.id}/shows$`))
  await expect(showPoster(page)).toBeVisible()
  await showPoster(page).click()
  await expect(page.getByText('Harbor Lights 1x2', { exact: true })).toBeVisible()
  await expect(page.getByText('Harbor Lights 1x1', { exact: true })).toBeVisible()
})

test('setting the default season opens the show on it', async ({ page }) => {
  await showPoster(page).click()
  await expect(page.getByText('Harbor Lights 1x1', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByText('Harbor Lights 2x1', { exact: true })).toBeVisible()

  await page.reload()
  await showPoster(page).click()
  await expect(page.getByText('Harbor Lights 2x1', { exact: true })).toBeVisible()
  await expect(page.getByText('Harbor Lights 1x1', { exact: true })).toHaveCount(0)
})
