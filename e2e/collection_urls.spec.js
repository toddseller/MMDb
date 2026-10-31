import { test, expect, USER, reseed, signIn } from './fixtures.js'

const settings = (page) => page.locator('#logIn')

test('an old numeric address lands on the handle and shows the collection', async ({ page }) => {
  await page.goto(`/users/${USER.id}`)

  await expect(page).toHaveURL(new RegExp(`/u/${USER.handle}$`))
  await expect(page.locator('#movie-list img[alt="Amber Poster"]')).toBeVisible()
})

test('the menu still switches to TV shows in place, keeping the address', async ({ page }) => {
  await signIn(page)
  await page.goto(`/u/${USER.handle}`)
  await page.locator('#menu-toggle').click()
  await page.locator('#user-profile').click()

  await page.locator('#drop-down-submenu #user-shows').click()

  await expect(page.locator('#show-list')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/u/${USER.handle}$`))
})

test.describe('changing the handle', () => {
  test.afterEach(reseed)

  test('moves the collection to the new address, and the old one follows it', async ({ page }) => {
    await signIn(page)
    await page.goto(`/u/${USER.handle}`)
    await page.locator('#menu-toggle').click()
    await page.getByRole('link', { name: 'Account Settings' }).click()

    await settings(page).getByLabel('Handle:').fill('edie')
    await settings(page).getByRole('button', { name: 'Update' }).click()
    await expect(settings(page)).toBeHidden()

    await page.goto('/u/edie')
    await expect(page.locator('#movie-list img[alt="Amber Poster"]')).toBeVisible()
    await page.goto(`/u/${USER.handle}/shows`)
    await expect(page).toHaveURL(/\/u\/edie\/shows$/)
  })
})
