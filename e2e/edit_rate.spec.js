import { test, expect, USER, reseed, signIn } from './fixtures.js'

const poster = (page, title) => page.locator(`#movie-list img[alt="${title} Poster"]`)

test.afterAll(reseed)

test.beforeEach(async ({ page }) => {
  await signIn(page)
  await page.goto(`/users/${USER.id}`)
  await expect(poster(page, 'Amber')).toBeVisible()
})

test('editing a movie from its details saves the change', async ({ page }) => {
  await poster(page, 'Edit Target').click()
  await expect(page.getByText('Edit Target is a seeded movie.')).toBeVisible()

  // The edit link is an icon with no text; its URL is what the server serves the form at.
  await page.locator('a[href*="/movies/"][href$="/edit"]').click()
  await page.locator('textarea[name="movie[plot]"]').fill('Edit Target now has a new plot.')
  await page.getByRole('button', { name: 'Update' }).click()

  await expect(page.getByText('Edit Target now has a new plot.')).toBeVisible()
  await page.reload()
  await poster(page, 'Edit Target').click()
  await expect(page.getByText('Edit Target now has a new plot.')).toBeVisible()
})

test('rating a movie keeps the rating when its details are reopened', async ({ page }) => {
  await poster(page, 'Rate Target').click()
  await expect(page.getByText('Rate Target is a seeded movie.')).toBeVisible()

  await page.getByText('4 stars').click()
  await expect(page.getByRole('radio', { name: '4 stars' })).toBeChecked()

  await page.reload()
  await poster(page, 'Rate Target').click()
  await expect(page.getByText('Rate Target is a seeded movie.')).toBeVisible()
  await expect(page.getByRole('radio', { name: '4 stars' })).toBeChecked()
})
