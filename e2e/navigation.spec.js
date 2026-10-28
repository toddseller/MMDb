import { test, expect, USER, OTHER, signIn } from './fixtures.js'

const menu = (page) => page.locator('#drop-down')
// The menu and another user's collection both carry #user-movies and #user-shows.
const menuLink = (page, name) => menu(page).getByRole('link', { name })
// The link wraps a floated button and has no size of its own, so the button is what gets clicked.
const pageButton = (page, name) => page.locator('#search-boxes').getByRole('button', { name })
const openSubmenu = async (page) => {
  await page.locator('#menu-toggle').click()
  await page.getByText('Profile').click()
}

// Counts the switch's requests; networkidle lets a duplicate that went out with the first one land before counting.
const requestsTo = (page, path) => {
  const sent = []
  page.on('request', (request) => { if (new URL(request.url()).pathname === path) sent.push(request) })
  return async () => {
    await page.waitForLoadState('networkidle')
    return sent.length
  }
}

test.describe('the Movies/TV Shows switch', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('the menu switches from movies to TV shows', async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
    const count = requestsTo(page, `/users/${USER.id}/shows`)
    await openSubmenu(page)

    await menuLink(page, 'TV Shows').click()

    await expect(page.locator('#show-list img[alt="Harbor Lights Poster"]')).toBeVisible()
    await expect(page.locator('#movie-list')).toHaveCount(0)
    await expect(menu(page)).not.toHaveClass(/active/)
    await expect(page.locator('.footer')).toHaveText('2 TV Shows \u2014 6 Episodes')
    expect(await count()).toBe(1)
  })

  test('the menu switches from TV shows to movies', async ({ page }) => {
    await page.goto(`/users/${USER.id}/shows`)
    const count = requestsTo(page, `/users/${USER.id}`)
    await openSubmenu(page)

    await menuLink(page, 'Movies').click()

    await expect(page.locator('#movie-list')).toBeVisible()
    await expect(page.locator('#show-list')).toHaveCount(0)
    await expect(menu(page)).not.toHaveClass(/active/)
    await expect(page.locator('.footer')).toHaveText('30 Movies')
    expect(await count()).toBe(1)
  })

  test("another user's TV Shows button switches to their shows", async ({ page }) => {
    await page.goto(`/users/${OTHER.id}`)
    const count = requestsTo(page, `/users/${OTHER.id}/shows`)

    await pageButton(page, 'TV Shows').click()

    await expect(page.locator('#show-list img[alt="Night Ferry Poster"]')).toBeVisible()
    await expect(page.locator('.footer')).toHaveText('1 TV Shows \u2014 2 Episodes')
    expect(await count()).toBe(1)
  })

  test("another user's Movies button switches to their movies", async ({ page }) => {
    await page.goto(`/users/${OTHER.id}/shows`)
    const count = requestsTo(page, `/users/${OTHER.id}`)

    await pageButton(page, 'Movies').click()

    await expect(page.locator('#movie-list').getByText('Ferry Lights')).toBeVisible()
    await expect(page.locator('.footer')).toHaveText('1 Movies')
    expect(await count()).toBe(1)
  })

  test('the button on a switched-in page switches back', async ({ page }) => {
    await page.goto(`/users/${OTHER.id}`)
    await pageButton(page, 'TV Shows').click()
    await expect(page.locator('#show-list')).toBeVisible()
    const count = requestsTo(page, `/users/${OTHER.id}`)

    await pageButton(page, 'Movies').click()

    await expect(page.locator('#movie-list').getByText('Ferry Lights')).toBeVisible()
    expect(await count()).toBe(1)
  })
})

test.describe('the menu', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto(`/users/${USER.id}`)
  })

  test('opens the profile submenu and the account settings', async ({ page }) => {
    // The menu button is an icon with no text.
    await page.locator('#menu-toggle').click()
    // The closed submenu is clipped to no height, so its links count as visible; what opens is its height.
    const submenu = page.locator('#drop-down-submenu')
    const height = async () => (await submenu.boundingBox()).height
    expect(await height()).toBe(0)
    await page.getByText('Profile').click()
    await expect.poll(height).toBeGreaterThan(40)

    await page.getByRole('link', { name: 'Account Settings' }).click()

    await expect(page.getByRole('dialog').filter({ has: page.getByRole('radiogroup', { name: 'Theme' }) })).toBeVisible()
  })

  test('closing the menu closes the submenu and turns its triangle back', async ({ page }) => {
    await openSubmenu(page)
    await expect(page.locator('#drop-down-submenu')).toHaveClass(/active/)

    await page.locator('#menu-toggle').click()

    await expect(menu(page)).not.toHaveClass(/active/)
    await expect(page.locator('#drop-down-submenu')).not.toHaveClass(/active/)
    await expect(page.locator('#user-profile .glyphicon-triangle-right')).not.toHaveClass(/active/)
  })
})

test('a home page poster opens the movie in a dialog', async ({ page }) => {
  await page.goto('/')
  const poster = page.locator('.top-preview img').first()
  const title = (await poster.getAttribute('alt')).replace(/ Poster$/, '')

  await poster.click()

  await expect(page.locator('#movie').getByRole('heading', { name: title })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})
