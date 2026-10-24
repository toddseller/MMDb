import { readFileSync } from 'node:fs'
import { test, expect, USER, reseed, signIn } from './fixtures.js'

// Written by the seed from the real routes and partials, with Apple and TMDB replaced by canned results.
const recorded = (name) => readFileSync(new URL(`./.generated/${name}.json`, import.meta.url), 'utf8')
const json = (body) => ({ body, contentType: 'application/json' })
const panel = (page) => page.locator('#preview')

/** Opens the movie search and submits it, answered with the named recording (or a failure). */
const searchMovies = async (page, answer) => {
  await page.route('**/movies?query=*', (route) => route.fulfill(answer))
  await page.getByRole('button', { name: 'Add Movie' }).click()
  await page.getByPlaceholder('Movie Title').fill('nova')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
}

test.afterAll(reseed)

test.describe('on the movies page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto(`/users/${USER.id}`)
    await expect(page.getByRole('button', { name: 'Add Movie' })).toBeVisible()
  })

  test('dismissing the results closes the panel and brings back Add Movie', async ({ page }) => {
    await searchMovies(page, json(recorded('movie_search')))
    await expect(page.getByRole('button', { name: 'Nova Drift Poster' })).toBeVisible()

    await page.locator('#dismiss').click()

    await expect(panel(page)).toBeHidden()
    await expect(page.locator('#dismiss')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Add Movie' })).toBeVisible()
    await expect(page.getByPlaceholder('Movie Title')).toBeHidden()
  })

  test('the arrows scroll through results that do not fit, and show only while there is more', async ({ page }) => {
    await searchMovies(page, json(recorded('movie_search_many')))
    await expect(page.getByRole('button', { name: 'Nova 12 Poster' })).toBeAttached()
    const left = page.locator('#scroll-left')
    const right = page.locator('#scroll-right')
    await expect(right).toBeVisible()
    await expect(left).toBeHidden()

    const width = await panel(page).evaluate((el) => el.clientWidth)
    await right.click()
    await expect.poll(() => panel(page).evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
    expect(await panel(page).evaluate((el) => el.scrollLeft)).toBeLessThanOrEqual(width)
    await expect(left).toBeVisible()

    for (let clicks = 0; clicks < 5 && await right.isVisible(); clicks++) {
      await right.click()
      await page.waitForTimeout(600)
    }
    await expect(right).toBeHidden()
    await expect(left).toBeVisible()
  })

  test('a failed movie search shows the placeholder', async ({ page }) => {
    await searchMovies(page, { status: 500, body: 'error' })

    await expect(panel(page).locator('img[src="/imgs/loading_image.svg"]')).toBeVisible()
  })

  test('a title with markup characters shows as text while it is added', async ({ page }) => {
    // Hold the add back so its message stays up long enough to read.
    let held
    await page.route(`**/users/${USER.id}/movies`, (route) => { held = route })
    await searchMovies(page, json(recorded('movie_search_markup')))

    await page.getByRole('button', { name: 'Nova <i>Drift</i> Poster' }).click()

    await expect(page.locator('#loading h3')).toHaveText('Adding Nova <i>Drift</i> to Your Collection...')
    await expect(page.locator('#loading h3 i')).toHaveCount(0)
    await held?.abort()
  })

  test('the edit form’s search fills the panel', async ({ page }) => {
    await page.route('**/movies/update?*', (route) => route.fulfill(json(recorded('movie_update_search'))))
    await page.locator('#movie-list img[alt="Edit Target Poster"]').click()
    await page.locator('a[href*="/movies/"][href$="/edit"]').click()

    await page.locator('#update-search').click()

    await expect(panel(page).locator('#update-movie img, #update-movie input[type=image]').first()).toBeVisible()
  })
})

test.describe('on the shows page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto(`/users/${USER.id}/shows`)
    await expect(page.getByRole('button', { name: 'Add TV Show' })).toBeVisible()
  })

  const searchShows = async (page, answer) => {
    await page.route('**/shows?query=*', (route) => route.fulfill(answer))
    await page.getByRole('button', { name: 'Add TV Show' }).click()
    await page.getByPlaceholder('TV Show Title').fill('harbor')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
  }

  test('adding a whole season lists its episodes under the show', async ({ page }) => {
    await page.route(`**/users/${USER.id}/shows`, (route) =>
      route.request().method() === 'POST' ? route.fulfill(json(recorded('show_episodes'))) : route.fallback())
    await searchShows(page, json(recorded('show_search')))
    await page.getByRole('button', { name: 'Harbor Lights Poster' }).click()

    await page.getByRole('button', { name: 'Add All Episodes' }).click()

    await expect(panel(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Add TV Show' })).toBeVisible()
    await page.locator('#show-list img[alt="Harbor Lights Poster"]').click()
    await expect(page.getByText('Harbor Lights 1x2', { exact: true })).toBeVisible()
  })

  test('a failed show search offers Create New Show', async ({ page }) => {
    await searchShows(page, { status: 500, body: 'error' })

    await expect(page.getByRole('button', { name: 'Create New Show' })).toBeVisible()
  })
})
