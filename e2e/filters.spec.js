import { test, expect, USER } from './fixtures.js'

// Titles as the grid names them, through each poster's alt text.
const titles = (page) => page.locator('#movie-list img[alt$=" Poster"]').evaluateAll((imgs) => imgs.map((img) => img.alt.replace(/ Poster$/, '')))
const grid = (page) => page.locator('#movie-list img[alt$=" Poster"]')

test.describe('collection filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
    await expect(grid(page)).toHaveCount(30)
  })

  test('a title search narrows the grid', async ({ page }) => {
    await page.getByPlaceholder('Search Collection').pressSequentially('amb')

    await expect(grid(page)).toHaveCount(1)
    expect(await titles(page)).toEqual(['Amber'])
  })

  test('unwatched shows only new movies', async ({ page }) => {
    await page.getByRole('link', { name: 'Unwatched' }).click()

    await expect(grid(page)).toHaveCount(1)
    expect(await titles(page)).toEqual(['Cedar'])
  })

  test('4K shows only 4K movies', async ({ page }) => {
    await page.getByRole('link', { name: '4K' }).click()

    await expect(grid(page)).toHaveCount(1)
    expect(await titles(page)).toEqual(['Ultra Sharp'])
  })

  test('clear restores the full collection', async ({ page }) => {
    await page.getByPlaceholder('Search Collection').pressSequentially('amb')
    await expect(grid(page)).toHaveCount(1)

    await page.getByRole('button', { name: 'Clear' }).click()

    await expect(grid(page)).toHaveCount(30)
    await expect(page.getByPlaceholder('Search Collection')).toHaveValue('')
  })

  // A new tab has searched nothing yet, so nothing is remembered about whose collection is on screen.
  for (const name of ['Library', 'Clear']) {
    test(`${name} restores the full collection in a new tab`, async ({ page }) => {
      await page.getByRole('link', { name: 'Unwatched' }).click()
      await expect(grid(page)).toHaveCount(1)

      await (name === 'Library' ? page.getByRole('link', { name }) : page.getByRole('button', { name })).click()

      await expect(grid(page)).toHaveCount(30)
    })
  }

  test('4K still works after the collection is cleared', async ({ page }) => {
    await page.getByPlaceholder('Search Collection').pressSequentially('amb')
    await expect(grid(page)).toHaveCount(1)
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(grid(page)).toHaveCount(30)

    await page.getByRole('link', { name: '4K' }).click()

    await expect(grid(page)).toHaveCount(1)
    expect(await titles(page)).toEqual(['Ultra Sharp'])
    await expect(page).toHaveURL(new RegExp(`/users/${USER.id}$`))
  })
})
