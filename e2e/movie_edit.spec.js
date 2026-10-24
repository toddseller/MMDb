import { readFileSync } from 'node:fs'
import { test, expect, USER, reseed, signIn } from './fixtures.js'

// Written by the seed from the real routes and partials, with the movie database replaced by a canned result.
const recorded = (name) => readFileSync(new URL(`./.generated/${name}.json`, import.meta.url), 'utf8')
// Only the tiles: the open drawer sits inside the grid and shows the movie's poster too.
const grid = (page) => page.locator('#movie-list .index-preview img[alt$=" Poster"]')
const titles = (page) => grid(page).evaluateAll((imgs) => imgs.map((img) => img.alt.replace(/ Poster$/, '')))
const form = (page) => page.locator('.info .edit-form')

const openForm = async (page, title) => {
  await page.locator(`#movie-list img[alt="${title} Poster"]`).click()
  await expect(page.getByText(`${title} is a seeded movie.`)).toBeVisible()
  await page.locator('.info a.movie-edit').click()
  await expect(form(page)).toBeVisible()
}

// Answers only the given method on a movie's own URL, so its details and edit form still load.
const fail = (page, method) => page.route(`**/users/${USER.id}/movies/*`, (route) =>
  route.request().method() === method ? route.fulfill({ status: 500, body: '' }) : route.continue())

// The form's own plot field holds the same text, so the details count as back only once the form has gone.
const detailsShown = async (page, title) => {
  await expect(form(page)).toHaveCount(0)
  await expect(page.locator('.info').getByText(`${title} is a seeded movie.`)).toBeVisible()
}

const filterBy = async (page, text) => {
  await page.getByPlaceholder('Search Collection').pressSequentially(text)
  await expect(page.locator('#movie-list img[alt="Amber Poster"]')).toHaveCount(0)
  return titles(page)
}

test.afterAll(reseed)

test.beforeEach(async ({ page }) => {
  await signIn(page)
  await page.goto(`/users/${USER.id}`)
  await expect(grid(page)).toHaveCount(30)
})

test('the edit form opens only in the drawer', async ({ page }) => {
  await openForm(page, 'Amber')

  await expect(page.locator('.edit-form')).toHaveCount(1)
})

test('picking a search result refreshes the form with its details', async ({ page }) => {
  await page.route('**/movies/update?*', (route) => route.fulfill({ body: recorded('movie_update_search'), contentType: 'application/json' }))
  await openForm(page, 'Edit Target')

  await page.locator('.info #update-search').click()
  await page.locator('#preview #update-movie input[type=image]').first().click()

  await expect(page.locator('#preview')).toBeHidden()
  await expect(form(page).locator('textarea[name="movie[title]"]')).toHaveValue('Nova Drift')
})

test('only one video quality can be checked', async ({ page }) => {
  await openForm(page, 'Garnet')
  const quality = (value) => form(page).locator(`input[type=checkbox][name="movie[hd]"][value="${value}"]`)
  await expect(quality(1080)).toBeChecked()

  await quality(4).check()
  await expect(quality(4)).toBeChecked()
  await expect(quality(1080)).not.toBeChecked()
  await expect(quality(720)).not.toBeChecked()

  await quality(4).uncheck()
  await expect(form(page).locator('input[type=checkbox][name="movie[hd]"]:checked')).toHaveCount(0)
})

test('saving a movie marked New keeps it New', async ({ page }) => {
  await openForm(page, 'Cedar')
  await expect(form(page).getByLabel('New')).toBeChecked()

  await form(page).getByRole('button', { name: 'Update' }).click()
  await detailsShown(page, 'Cedar')
  await page.reload()
  await openForm(page, 'Cedar')

  await expect(form(page).getByLabel('New')).toBeChecked()
})

test('a failed save says so and keeps the edits', async ({ page }) => {
  await fail(page, 'PUT')
  await openForm(page, 'Birch')

  await form(page).locator('textarea[name="movie[plot]"]').fill('Birch has an unsaved plot.')
  await form(page).getByRole('button', { name: 'Update' }).click()

  await expect(page.getByRole('alert')).toHaveText("Couldn't save Birch. Try again.")
  await expect(form(page).locator('textarea[name="movie[plot]"]')).toHaveValue('Birch has an unsaved plot.')
  await expect(grid(page)).toHaveCount(30)
})

test('a failed delete says so and keeps the movie', async ({ page }) => {
  await fail(page, 'DELETE')
  await openForm(page, 'Juniper')

  await form(page).locator('xpath=..').getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByRole('alert')).toHaveText("Couldn't delete Juniper. Try again.")
  await expect(form(page)).toBeVisible()
  await expect(grid(page).and(page.locator('[alt="Juniper Poster"]'))).toHaveCount(1)
})

test('saving while the title filter is on keeps the filtered list', async ({ page }) => {
  const filtered = await filterBy(page, 'target')
  await openForm(page, 'Rate Target')

  await form(page).getByRole('button', { name: 'Update' }).click()

  await detailsShown(page, 'Rate Target')
  expect(await titles(page)).toEqual(filtered)
})

test('deleting while the title filter is on keeps the rest of the filtered list', async ({ page }) => {
  const filtered = await filterBy(page, 'target')
  await openForm(page, 'Delete Target')

  await form(page).locator('xpath=..').getByRole('button', { name: 'Delete' }).click()

  await expect(grid(page).and(page.locator('[alt="Delete Target Poster"]'))).toHaveCount(0)
  expect(await titles(page)).toEqual(filtered.filter((title) => title !== 'Delete Target'))
})
