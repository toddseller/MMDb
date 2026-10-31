import { readFileSync } from 'node:fs'
import { test, expect, USER, reseed, signIn } from './fixtures.js'

// Written by the seed from the real routes and partials, with Apple and TMDB replaced by canned results.
const recorded = (name) => readFileSync(new URL(`./.generated/${name}.json`, import.meta.url), 'utf8')
const json = (body) => ({ body, contentType: 'application/json' })
const panel = (page) => page.locator('#preview')
// The first result shows while the panel is still sliding open; a click before it finishes misses what the open panel covers.
const opened = (page) => panel(page).evaluate((el) => Promise.all(el.getAnimations().map((animation) => animation.finished)))

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

  test('opening a poster closes the add search’s results', async ({ page }) => {
    await searchMovies(page, json(recorded('movie_search')))
    await expect(page.getByRole('button', { name: 'Nova Drift Poster' })).toBeVisible()
    await opened(page)

    // Not a first-row poster: the open panel covers that row at every scroll position.
    await page.locator('#movie-list img[alt="Meadow Poster"]').click()

    await expect(page.getByText('Meadow is a seeded movie.')).toBeVisible()
    await expect(panel(page)).toBeHidden()
    await expect(page.getByRole('button', { name: 'Add Movie' })).toBeVisible()
  })

  // The results update the movie they were searched for, so they mustn't outlive its drawer.
  test('opening another poster closes the edit search’s results', async ({ page }) => {
    await page.route('**/movies/update?*', (route) => route.fulfill(json(recorded('movie_update_search'))))
    await page.locator('#movie-list img[alt="Edit Target Poster"]').click()
    await page.locator('a[href*="/movies/"][href$="/edit"]').click()
    await page.locator('#update-search').click()
    await expect(panel(page).locator('#update-movie img, #update-movie input[type=image]').first()).toBeVisible()
    await opened(page)

    // Not a first-row poster: the open panel covers that row at every scroll position.
    await page.locator('#movie-list img[alt="Meadow Poster"]').click()

    await expect(page.getByText('Meadow is a seeded movie.')).toBeVisible()
    await expect(panel(page)).toBeHidden()
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

  /** Picks Harbor Lights' first season in the panel, then adds its missing episode, 1x2. */
  const addHarborEpisode = async (page) => {
    await page.route(`**/users/${USER.id}/shows`, (route) =>
      route.request().method() === 'POST' ? route.fulfill(json(recorded('show_episodes'))) : route.fallback())
    await searchShows(page, json(recorded('show_search')))
    await page.getByRole('button', { name: 'Harbor Lights Poster' }).click()
    await panel(page).locator('#episode-video').click()
    await expect(panel(page)).toBeHidden()
  }
  const drawer = (page) => page.locator('#show-list > .info')
  const openPoster = (page, title) => page.locator(`#show-list > .index-preview-show.open img[alt="${title} Poster"]`)

  // Runs before the whole-season test below, which adds 1x2 for good.
  test('adding episodes to the open show keeps its drawer open with the new episode', async ({ page }) => {
    await page.locator('#show-list img[alt="Harbor Lights Poster"]').click()
    await expect(drawer(page).getByText('Harbor Lights 1x1', { exact: true })).toBeVisible()
    await expect(drawer(page).getByText('Harbor Lights 1x2', { exact: true })).toHaveCount(0)

    await addHarborEpisode(page)

    await expect(drawer(page).getByText('Harbor Lights 1x2', { exact: true })).toBeVisible()
    await expect(drawer(page)).toHaveCount(1)
    await expect(openPoster(page, 'Harbor Lights')).toBeVisible()
  })

  test('adding episodes to another show keeps the open drawer, which changes height at once under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.locator('#show-list img[alt="Tide Tables Poster"]').click()
    await expect(drawer(page).getByText('Tide Tables 1x3', { exact: true })).toBeVisible()

    await addHarborEpisode(page)

    await expect(drawer(page).getByText('Tide Tables 1x3', { exact: true })).toBeVisible()
    await expect(openPoster(page, 'Tide Tables')).toBeVisible()
    expect(await drawer(page).locator('.info-wrapper').evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')
  })

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
