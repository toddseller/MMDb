import { readFileSync } from 'node:fs'
import { test, expect, USER, reseed, signIn } from './fixtures.js'

// Written by the seed from the real search route and _preview partial, with Apple and TMDB replaced by a canned result.
const searchResponse = () => readFileSync(new URL('./.generated/movie_search.json', import.meta.url), 'utf8')
const grid = (page) => page.locator('#movie-list img[alt$=" Poster"]')

test.afterAll(reseed)

test('adding a movie from a search puts it in the collection', async ({ page }) => {
  await signIn(page)
  await page.route('**/movies?query=*', (route) => route.fulfill({ body: searchResponse(), contentType: 'application/json' }))
  await page.goto(`/users/${USER.id}`)
  await expect(grid(page)).toHaveCount(30)

  await page.getByRole('button', { name: 'Add Movie' }).click()
  await page.getByPlaceholder('Movie Title').fill('nova')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('button', { name: 'Nova Drift Poster' }).click()

  await expect(grid(page)).toHaveCount(31)
  await expect(page.locator('#movie-list img[alt="Nova Drift Poster"]')).toHaveCount(1)
  await expect(page.getByText('31 Movies')).toBeVisible()
})
