import { readFileSync } from 'node:fs'
import { test, expect, USER } from './fixtures.js'

// Written by the seed from the real search route, with TMDB's person lookup replaced by a canned picture.
const recorded = { 'Cy Dunn': 'credit_search', 'Amber Films': 'studio_search' }
const response = (name) => readFileSync(new URL(`./.generated/${recorded[name]}.json`, import.meta.url), 'utf8')
const titles = (page) => page.locator('#movie-list > div > p')

/** @returns {string[]} the filter of every credit search the page sends */
const answerSearches = async (page) => {
  const searches = []
  await page.route('**/movies/search?*', (route) => {
    // Credits after the first keep the space after their comma, which the server's search ignores.
    const name = new URL(route.request().url()).searchParams.get('filter').trim()
    searches.push(name)
    return route.fulfill({ body: response(name), contentType: 'application/json' })
  })
  return searches
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/users/${USER.id}`)
  await expect(titles(page).first()).toBeVisible()
})

test('clicking an actor lists their movies under their profile', async ({ page }) => {
  const searches = await answerSearches(page)
  await page.locator('#search-movie-title').pressSequentially('amb')
  await expect(titles(page)).toHaveText(['Amber'])
  await page.locator('#movie-list a').first().click()

  await page.getByRole('link', { name: 'Cy Dunn' }).click()

  await expect(page.locator('#profile-name')).toHaveText('Cy Dunn')
  await expect(page.locator('#profile-image')).toHaveAttribute('src', /cy-dunn\.jpg$/)
  await expect(page.locator('#profile-image')).not.toHaveCSS('display', 'none')
  await expect(page.locator('#profile-wrapper')).toHaveClass(/active/)
  await expect(titles(page)).toHaveText(['Amber'])
  await expect(page.locator('#search-movie-title')).toHaveValue('')
  await expect(page).toHaveURL(new RegExp(`/users/${USER.id}$`))
  expect(searches).toEqual(['Cy Dunn'])
})

test('clicking the studio searches once', async ({ page }) => {
  const searches = await answerSearches(page)
  await page.locator('#movie-list a').first().click()

  await page.getByRole('link', { name: 'Amber Films' }).click()

  await expect(page.locator('#profile-name')).toHaveText('Amber Films')
  await expect(page.locator('#profile-image')).toHaveCSS('display', 'none')
  await expect(titles(page)).toHaveText(['Amber'])
  // Let a second, duplicate request arrive if one is coming.
  await page.waitForTimeout(500)
  expect(searches).toEqual(['Amber Films'])
})
