import { test, expect, USER, reseed, signIn } from './fixtures.js'

const grid = (page) => page.locator('#movie-list img[alt$=" Poster"]')

test.afterAll(reseed)

test('deleting a movie from its details removes it from the collection', async ({ page }) => {
  await signIn(page)
  await page.goto(`/users/${USER.id}`)
  await expect(grid(page)).toHaveCount(30)

  await page.locator('#movie-list img[alt="Delete Target Poster"]').click()
  await expect(page.getByText('Delete Target is a seeded movie.')).toBeVisible()
  // The edit link is an icon with no text; its URL is what the server serves the form at.
  await page.locator('a[href*="/movies/"][href$="/edit"]').click()
  await page.getByRole('button', { name: 'Delete' }).click()

  await expect(grid(page)).toHaveCount(29)
  await expect(page.locator('#movie-list img[alt="Delete Target Poster"]')).toHaveCount(0)
  await expect(page.getByText('29 Movies')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/users/${USER.id}$`))
})
