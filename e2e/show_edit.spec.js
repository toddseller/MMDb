import { readFileSync } from 'node:fs'
import { test, expect, USER, reseed, signIn } from './fixtures.js'

// Written by the seed from the real routes and partials, with Apple and TMDB replaced by canned results.
const recorded = (name) => readFileSync(new URL(`./.generated/${name}.json`, import.meta.url), 'utf8')
const json = (body) => ({ body, contentType: 'application/json' })
const dialog = (page) => page.locator('#edit-show')
const field = (page, name) => dialog(page).locator(`[name="${name}"]`).first()
const tile = (page) => page.locator('#show-list .index-preview-show img[alt="Tide Tables Poster"]')
const drawerPoster = (page) => page.locator('.info .description-poster img')
const oldPoster = 'https://is1-ssl.mzstatic.com/image/thumb/tide-tables/600x600.jpg'
const newPoster = 'https://is1-ssl.mzstatic.com/image/thumb/new-tides/600x600.jpg'

// Tests run in file order against one seed, so none of them renames the show or the first episode it opens on.
const openDialog = async (page) => {
  await tile(page).click()
  await expect(page.locator('.info').getByText('Tide Tables 1x3', { exact: true })).toBeVisible()
  // The edit link is an icon with no text; its URL is what the server serves the form at.
  await page.locator('.info a[href$="/edit"]').click()
  await expect(field(page, 'episode[title]')).toHaveValue('Tide Tables 1x1')
}

const closed = (page) => expect(dialog(page)).toBeHidden()

// Answers only the given method on the show's own URLs, so the drawer and dialog still load.
const fail = (page, method) => page.route(`**/users/${USER.id}/shows/**`, (route) =>
  route.request().method() === method ? route.fulfill({ status: 500, body: '' }) : route.fallback())

const searchShows = async (page, answer) => {
  await page.route('**/shows?query=*', (route) => route.fulfill(answer))
  await page.getByRole('button', { name: 'Add TV Show' }).click()
  await page.getByPlaceholder('TV Show Title').fill('harbor')
  await page.getByRole('button', { name: 'Search', exact: true }).click()
}

test.afterAll(reseed)

test.beforeEach(async ({ page }) => {
  await signIn(page)
  await page.goto(`/users/${USER.id}/shows`)
  await expect(tile(page)).toBeVisible()
})

test('switching tabs sends nothing', async ({ page }) => {
  await openDialog(page)
  const sent = []
  page.on('request', (request) => { if (request.method() !== 'GET') sent.push(request.method()) })

  for (const tab of ['Artwork', 'Season', 'Sorting', 'Details']) {
    await dialog(page).getByRole('button', { name: tab, exact: true }).click()
    await expect(dialog(page).getByRole('button', { name: tab, exact: true })).toHaveClass(/active/)
  }

  await expect(field(page, 'episode[title]')).toBeVisible()
  expect(sent).toEqual([])
})

test('Cancel closes without saving', async ({ page }) => {
  await openDialog(page)
  await field(page, 'episode[title]').fill('Not Saved')
  await dialog(page).getByRole('button', { name: 'Sorting', exact: true }).click()

  await dialog(page).getByRole('button', { name: 'Cancel' }).click()

  await closed(page)
  await page.locator('.info a[href$="/edit"]').click()
  await expect(field(page, 'episode[title]')).toHaveValue('Tide Tables 1x1')
})

test('OK saves every tab and closes once saved', async ({ page }) => {
  await openDialog(page)
  await dialog(page).getByRole('button', { name: 'Season', exact: true }).click()
  await field(page, 'show[genre]').fill('Mystery')

  await dialog(page).getByRole('button', { name: 'OK' }).click()

  await closed(page)
  await expect(page.locator('.info .series-details')).toContainText('Mystery')
})

test('a failed save keeps the dialog open and says so', async ({ page }) => {
  await fail(page, 'PUT')
  await openDialog(page)
  await field(page, 'episode[plot]').fill('Kept as typed.')

  await dialog(page).getByRole('button', { name: 'OK' }).click()

  await expect(dialog(page).getByRole('alert')).toHaveText("Couldn't save Tide Tables. Try again.")
  await expect(dialog(page)).toBeVisible()
  await expect(field(page, 'episode[plot]')).toHaveValue('Kept as typed.')
})

test('Enter in a field saves and closes like OK', async ({ page }) => {
  await openDialog(page)
  await field(page, 'episode[plot]').fill('Saved by Enter.')
  const url = page.url()

  await field(page, 'episode[tv_episode]').press('Enter')

  await closed(page)
  expect(page.url()).toBe(url)
  await page.locator('.info a[href$="/edit"]').click()
  await expect(field(page, 'episode[plot]')).toHaveValue('Saved by Enter.')
})

test('a failed save by Enter keeps the dialog open and says so', async ({ page }) => {
  await fail(page, 'PUT')
  await openDialog(page)

  await field(page, 'episode[tv_episode]').press('Enter')

  await expect(dialog(page).getByRole('alert')).toHaveText("Couldn't save Tide Tables. Try again.")
  await expect(dialog(page)).toBeVisible()
})

test('the arrows save, then move between episodes', async ({ page }) => {
  await openDialog(page)
  const [previous, next] = [dialog(page).locator('.edit-next').first(), dialog(page).locator('.edit-next').last()]
  await expect(previous).toBeDisabled()
  await field(page, 'episode[plot]').fill('Saved by the arrow.')

  await next.click()
  await expect(field(page, 'episode[title]')).toHaveValue('Tide Tables 1x2')
  await expect(dialog(page)).not.toContainText('success')

  await dialog(page).locator('.edit-next').first().click()
  await expect(field(page, 'episode[title]')).toHaveValue('Tide Tables 1x1')
  await expect(field(page, 'episode[plot]')).toHaveValue('Saved by the arrow.')
})

test('a saved poster shows in the drawer and on the grid tile', async ({ page }) => {
  await openDialog(page)
  await dialog(page).getByRole('button', { name: 'Artwork', exact: true }).click()
  await field(page, 'season[poster]').fill(newPoster)
  await field(page, 'season[poster]').press('Tab')

  await dialog(page).getByRole('button', { name: 'OK' }).click()

  await closed(page)
  await expect(drawerPoster(page)).toHaveAttribute('src', newPoster)
  await expect(tile(page)).toHaveAttribute('src', newPoster.replace('600x600', '400x400'))
})

test('a cancelled poster stays in the dialog', async ({ page }) => {
  await openDialog(page)
  const before = await tile(page).getAttribute('src')
  await dialog(page).getByRole('button', { name: 'Artwork', exact: true }).click()
  await field(page, 'season[poster]').fill('https://is1-ssl.mzstatic.com/image/thumb/cancelled/600x600.jpg')
  await field(page, 'season[poster]').press('Tab')
  await expect(dialog(page).locator('.edit-poster img')).toHaveAttribute('src', /cancelled/)

  await dialog(page).getByRole('button', { name: 'Cancel' }).click()

  await closed(page)
  await expect(drawerPoster(page)).not.toHaveAttribute('src', /cancelled/)
  await expect(tile(page)).toHaveAttribute('src', before)
})

test('a failed delete keeps the episode and says so', async ({ page }) => {
  await fail(page, 'DELETE')
  await openDialog(page)

  await dialog(page).getByRole('button', { name: 'Delete Episode' }).click()

  await expect(dialog(page).getByRole('alert')).toHaveText("Couldn't delete Tide Tables 1x1. Try again.")
  await expect(field(page, 'episode[title]')).toHaveValue('Tide Tables 1x1')
})

test('Delete Episode shows the next episode and the new counts', async ({ page }) => {
  await openDialog(page)

  await dialog(page).getByRole('button', { name: 'Delete Episode' }).click()

  await expect(field(page, 'episode[title]')).toHaveValue('Tide Tables 1x2')
  // Harbor Lights has three episodes and Tide Tables had three.
  await expect(page.locator('.footer')).toHaveText('2 TV Shows — 5 Episodes')
})

test.describe('Create New Show', () => {
  // The server finds a hand-made show by its blank collection id, so a second one would join the first.
  test.afterEach(reseed)

  const create = async (page) => {
    await expect(dialog(page).getByRole('button', { name: 'Episode', exact: true })).toBeVisible()
    await field(page, 'show[title]').fill('Handmade')
    await dialog(page).getByRole('button', { name: 'Season', exact: true }).click()
    await field(page, 'season[season]').fill('1')
    await dialog(page).getByRole('button', { name: 'Episode', exact: true }).click()
  }
  const episode = async (page, number) => {
    await field(page, 'episode[title]').fill(`Handmade 1x${number}`)
    await field(page, 'episode[tv_episode]').fill(`${number}`)
  }

  test('adds a show with the episodes from "+" and OK', async ({ page }) => {
    await searchShows(page, { status: 500, body: 'error' })
    await page.getByRole('button', { name: 'Create New Show' }).click()
    await create(page)
    await episode(page, 1)

    await dialog(page).locator('#add-new-episode').click()
    await expect(field(page, 'episode[title]')).toHaveValue('')
    await expect(dialog(page).locator('.modal-header p')).toHaveText('Season 1, 1 episode added')
    await episode(page, 2)
    await dialog(page).getByRole('button', { name: 'OK' }).click()

    await closed(page)
    await page.locator('#show-list img[alt="Handmade Poster"]').click()
    await expect(page.locator('.info').getByText('Handmade 1x1', { exact: true })).toBeVisible()
    await expect(page.locator('.info').getByText('Handmade 1x2', { exact: true })).toBeVisible()
  })

  test('OK on the blank episode after "+" adds no untitled episode', async ({ page }) => {
    await searchShows(page, { status: 500, body: 'error' })
    await page.getByRole('button', { name: 'Create New Show' }).click()
    await create(page)
    await episode(page, 1)
    await dialog(page).locator('#add-new-episode').click()
    await expect(field(page, 'episode[title]')).toHaveValue('')

    await dialog(page).getByRole('button', { name: 'OK' }).click()

    await closed(page)
    await page.locator('#show-list img[alt="Handmade Poster"]').click()
    await expect(page.locator('.info #counts')).toHaveText('1 season, 1 episode')
  })

  test('Enter adds the show with its titled episode', async ({ page }) => {
    await searchShows(page, { status: 500, body: 'error' })
    await page.getByRole('button', { name: 'Create New Show' }).click()
    await create(page)
    await episode(page, 1)

    await field(page, 'episode[tv_episode]').press('Enter')

    await closed(page)
    await page.locator('#show-list img[alt="Handmade Poster"]').click()
    await expect(page.locator('.info').getByText('Handmade 1x1', { exact: true })).toBeVisible()
  })

  test('a season with no episodes offers it', async ({ page }) => {
    await page.route(`**/users/${USER.id}/shows`, (route) =>
      route.request().method() === 'POST' ? route.fulfill(json(recorded('show_episodes_empty'))) : route.fallback())
    await searchShows(page, json(recorded('show_search')))
    await page.getByRole('button', { name: 'Harbor Lights Poster' }).click()

    await page.getByRole('button', { name: 'Create New Show' }).click()

    await expect(dialog(page).getByRole('button', { name: 'Episode', exact: true })).toBeVisible()
  })
})
