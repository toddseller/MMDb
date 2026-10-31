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
  await expect(page).toHaveURL(new RegExp(`/u/${USER.handle}/shows$`))
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

test('a long episode plot expands and collapses', async ({ page }) => {
  await showPoster(page).click()
  const plot = page.locator('.plot-truncate', { hasText: 'lighthouse dark' })
  const toggle = page.locator('.expand-plot').first()
  await expect(toggle).toHaveText('more')
  const truncated = (await plot.boundingBox()).height
  // The toggle's row tucks under the plot and its word sits at the right end, which is the only part a user can click.
  const word = async () => { const { width, height } = await toggle.boundingBox(); return { position: { x: width - 5, y: height / 2 } } }

  await toggle.click(await word())
  await expect(toggle).toHaveText('less')
  await expect.poll(async () => (await plot.boundingBox()).height).toBeGreaterThan(truncated)

  await toggle.click(await word())
  await expect(toggle).toHaveText('more')
  await expect.poll(async () => (await plot.boundingBox()).height).toBe(truncated)
})

test.describe('a show with more seasons than fit on one line', () => {
  const oldHouse = (page) => page.locator('#show-list img[alt="Old House Hours Poster"]')
  const line = (page) => page.locator('#season-default')
  const earlier = (page) => page.getByRole('button', { name: 'Earlier seasons' })
  const later = (page) => page.getByRole('button', { name: 'Later seasons' })
  const scrolled = (page) => line(page).evaluate((el) => el.scrollLeft)
  // The seasons wholly inside the line, as the user sees them.
  const inView = (page) => line(page).evaluate((el) => {
    const box = el.getBoundingClientRect()
    return [...el.querySelectorAll('.season-submit')].filter((season) => {
      const { left, right } = season.getBoundingClientRect()
      return left >= box.left && right <= box.right
    }).map((season) => Number(season.value))
  })

  test('keeps its seasons on one line and opens on the active season', async ({ page }) => {
    await oldHouse(page).click()
    const seasons = line(page).locator('.season-submit')
    await expect(seasons).toHaveCount(48)

    expect(await seasons.evaluateAll((els) => new Set(els.map((el) => el.getBoundingClientRect().top)).size)).toBe(1)
    await expect(page.locator('#active-season')).toHaveValue('48')
    expect(await inView(page)).toContain(48)
    await expect(earlier(page)).toBeVisible()
    await expect(later(page)).toBeHidden()
  })

  test('arrows scroll the line, and switching seasons leaves it where it was', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await oldHouse(page).click()
    await expect(earlier(page)).toBeVisible()
    const end = await scrolled(page)

    await earlier(page).click()
    await expect.poll(() => scrolled(page)).toBeLessThan(end)
    await expect(later(page)).toBeVisible()
    const position = await scrolled(page)
    const target = (await inView(page))[2]

    await line(page).getByRole('button', { name: String(target), exact: true }).click()
    await expect(page.locator('#active-season')).toHaveValue(String(target))
    expect(await scrolled(page)).toBe(position)
  })

  test('a season reached by Tab is never hidden under an arrow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await oldHouse(page).click()
    // Not the arrows: the test before this one leaves the show on a season in the middle.
    await expect(line(page).locator('.season-submit')).toHaveCount(48)
    await line(page).evaluate((el) => { el.scrollLeft = 0 })
    const next = Math.max(...await inView(page)) + 1
    const season = line(page).getByRole('button', { name: String(next), exact: true })

    await line(page).getByRole('button', { name: String(next - 1), exact: true }).focus()
    await page.keyboard.press('Tab')

    await expect(season).toBeFocused()
    const [box, arrow] = await Promise.all([season.boundingBox(), later(page).boundingBox()])
    expect(box.x + box.width).toBeLessThanOrEqual(arrow.x)
  })

  test('a show reopened on a season in the middle lands it clear of the right arrow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await oldHouse(page).click()
    await line(page).getByRole('button', { name: '40', exact: true }).click()
    await expect(page.locator('#active-season')).toHaveValue('40')

    await page.reload()
    await oldHouse(page).click()

    await expect(page.locator('#active-season')).toHaveValue('40')
    await expect(later(page)).toBeVisible()
    const [box, arrow] = await Promise.all([page.locator('#active-season').boundingBox(), later(page).boundingBox()])
    expect(box.x + box.width).toBeLessThanOrEqual(arrow.x)
  })

  test('a show whose seasons fit shows no arrows', async ({ page }) => {
    await showPoster(page).click()
    // Not an episode: an earlier test here leaves Harbor Lights on another season.
    await expect(line(page).locator('.season-submit')).toHaveCount(3)

    await expect(earlier(page)).toBeHidden()
    await expect(later(page)).toBeHidden()
  })
})
