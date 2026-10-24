import { test, expect, USER, signIn } from './fixtures.js'

const signInDialog = (page) => page.getByRole('dialog').filter({ hasText: 'Sign in!' })

test.describe('signed out', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
  })

  test('the sign-in modal opens and closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(signInDialog(page)).toBeVisible()

    await signInDialog(page).getByRole('button', { name: 'Close' }).click()

    await expect(signInDialog(page)).toBeHidden()
  })

  test('signing in through the modal opens the collection signed in', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click()
    // The labels aren't tied to their inputs, so the fields are found by what they show.
    await signInDialog(page).getByPlaceholder('User Name or Email').fill(USER.email)
    await signInDialog(page).getByPlaceholder('Password').fill(USER.password)
    await signInDialog(page).getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Signed in as')).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/users/${USER.id}$`))
  })
})

test.describe('signed in', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('the menu opens the profile submenu and the account settings', async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
    // The menu button is an icon with no text.
    await page.locator('#menu-toggle').click()
    // The closed submenu is clipped to no height, so its links count as visible; what opens is its height.
    const submenu = page.getByRole('link', { name: 'TV Shows' }).locator('xpath=ancestor::div[1]')
    const height = async () => (await submenu.boundingBox()).height
    expect(await height()).toBe(0)
    await page.getByText('Profile').click()
    await expect.poll(height).toBeGreaterThan(40)

    await page.getByRole('link', { name: 'Account Settings' }).click()

    await expect(page.getByRole('dialog').filter({ has: page.locator('label[for="myonoffswitch"]') })).toBeVisible()
  })

  test('the theme switch changes the page to the dark theme', async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(234, 234, 234)')
    await page.locator('#menu-toggle').click()
    await page.getByRole('link', { name: 'Account Settings' }).click()

    // The switch's checkbox is hidden; its label is what a user clicks.
    await page.locator('label[for="myonoffswitch"]').click()

    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(43, 43, 43)')
  })

  test('the edit-show tabs switch panels', async ({ page }) => {
    await page.goto(`/users/${USER.id}/shows`)
    await page.locator('#show-list img[alt="Harbor Lights Poster"]').click()
    // The edit link is an icon with no text; its URL is what the server serves the form at.
    await page.locator('a[href*="/shows/"][href$="/edit"]').click()
    await expect(page.getByRole('button', { name: 'Details' })).toBeVisible()
    await expect(page.getByText('Upload', { exact: true })).toBeHidden()

    await page.getByRole('button', { name: 'Artwork' }).click()

    await expect(page.getByText('Upload', { exact: true })).toBeVisible()
  })
})
