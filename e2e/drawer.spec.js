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
