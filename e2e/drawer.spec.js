import { test, expect, USER } from './fixtures.js'

// Seeded titles sort into rows of 7: Amber..Ember, then Fable..Lantern, then Meadow..
const poster = (page, title) => page.locator('#movie-list > div').filter({ has: page.locator('p', { hasText: new RegExp(`^${title}$`) }) }).locator('a').first()
const details = (page, title) => page.getByText(`${title} is a seeded movie.`)

const box = async (locator) => locator.boundingBox()

test.describe('movie details drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
    await expect(poster(page, 'Amber')).toBeVisible()
  })

  test('opens a movie under its row', async ({ page }) => {
    await poster(page, 'Birch').click()

    await expect(details(page, 'Birch')).toBeVisible()
    const drawer = await box(details(page, 'Birch'))
    expect(drawer.y).toBeGreaterThan((await box(poster(page, 'Ember'))).y + 200)
    expect(drawer.y).toBeLessThan((await box(poster(page, 'Fable'))).y)
  })

  test('swaps the details for another movie in the same row', async ({ page }) => {
    await poster(page, 'Birch').click()
    await expect(details(page, 'Birch')).toBeVisible()

    await poster(page, 'Delta').click()

    await expect(details(page, 'Delta')).toBeVisible()
    await expect(details(page, 'Birch')).toHaveCount(0)
  })

  test('moves the drawer under another row', async ({ page }) => {
    await poster(page, 'Birch').click()
    await expect(details(page, 'Birch')).toBeVisible()

    await poster(page, 'Meadow').click()

    await expect(details(page, 'Meadow')).toBeVisible()
    await expect(details(page, 'Birch')).toHaveCount(0)
    expect((await box(details(page, 'Meadow'))).y).toBeGreaterThan((await box(poster(page, 'Meadow'))).y)
  })

  test('closes when the open movie is clicked again', async ({ page }) => {
    await poster(page, 'Birch').click()
    await expect(details(page, 'Birch')).toBeVisible()

    await poster(page, 'Birch').click()

    await expect(details(page, 'Birch')).toHaveCount(0)
  })
})

// The page glides with the browser's smooth scroll; a position is read once scrollY has stopped changing.
const settled = async (page) => {
  let last = -1
  await expect.poll(async () => {
    const y = await page.evaluate(() => window.scrollY)
    const still = y === last
    last = y
    return still
  }, { intervals: [150] }).toBe(true)
  return last
}
const drawerBox = (page) => box(page.locator('#movie-list > .info, #show-list > .info'))
const openTileBox = (page) => box(page.locator('#movie-list > .index-preview.open, #show-list > .index-preview-show.open'))

test.describe('the drawer glides into view', () => {
  // Tall enough for a row and its drawer (about 930px) between the 170px header and the footer.
  test('a poster near the bottom of the screen opens with the whole drawer above the footer', async ({ page }) => {
    const height = 1200
    await page.setViewportSize({ width: 1500, height })
    await page.goto(`/users/${USER.id}`)
    await expect(poster(page, 'Fable')).toBeVisible()

    await poster(page, 'Fable').click()
    await expect(details(page, 'Fable')).toBeVisible()
    expect(await settled(page)).toBeGreaterThan(0)

    const drawer = await drawerBox(page)
    expect(drawer.y + drawer.height).toBeLessThanOrEqual(height - 25 + 1)
    expect((await openTileBox(page)).y).toBeGreaterThanOrEqual(160 - 1)
  })

  test('a drawer taller than a short window leaves its poster’s row just below the top bar', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 450 })
    await page.goto(`/users/${USER.id}`)
    await expect(poster(page, 'Birch')).toBeVisible()

    await poster(page, 'Birch').click()
    await expect(details(page, 'Birch')).toBeVisible()
    await settled(page)

    expect(Math.abs((await openTileBox(page)).y - 60)).toBeLessThanOrEqual(2)
  })

  test('a drawer already in view leaves the page where it was', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 1400 })
    await page.goto(`/users/${USER.id}`)
    await expect(poster(page, 'Birch')).toBeVisible()

    await poster(page, 'Birch').click()
    await expect(details(page, 'Birch')).toBeVisible()

    expect(await settled(page)).toBe(0)
  })

  test('expanding a plot leaves the page where it was', async ({ page }) => {
    await page.setViewportSize({ width: 1500, height: 700 })
    await page.goto(`/users/${USER.id}/shows`)
    await page.locator('#show-list img[alt="Harbor Lights Poster"]').click()
    const more = page.locator('#show-list > .info .expand-plot').first()
    await expect(more).toBeVisible()
    await settled(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    expect(await settled(page)).toBe(0)
    const drawer = await drawerBox(page)
    expect(drawer.y + drawer.height).toBeGreaterThan(700 - 25)

    await more.dispatchEvent('click')
    await expect(more).toHaveText('less')

    expect(await settled(page)).toBe(0)
  })
})
