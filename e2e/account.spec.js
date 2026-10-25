import { test, expect, USER, reseed, signIn } from './fixtures.js'

const signInDialog = (page) => page.getByRole('dialog').filter({ hasText: 'Sign in!' })
// Account Settings replaces the sign-in form inside the same Bootstrap modal.
const settings = (page) => page.locator('#logIn')
const field = (page, name) => settings(page).locator(`input[name="${name}"]`)
const update = (page) => settings(page).getByRole('button', { name: 'Update' })
const themeLinks = (page) => page.locator('link[rel="stylesheet"][href*="/css/dark.css"], link[rel="stylesheet"][href*="/css/default.css"]')
const LIGHT = 'rgb(234, 234, 234)'
const DARK = 'rgb(43, 43, 43)'

const openSettings = async (page) => {
  await page.locator('#menu-toggle').click()
  await page.getByRole('link', { name: 'Account Settings' }).click()
  await expect(field(page, 'first_name')).toBeVisible()
}
// The switch's checkbox is hidden; its label is what a user clicks.
const flipTheme = (page) => page.locator('label[for="myonoffswitch"]').click()

test.describe('signed out', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(signInDialog(page)).toBeVisible()
  })

  test('the sign-in modal opens and closes', async ({ page }) => {
    await signInDialog(page).getByRole('button', { name: 'Close' }).click()

    await expect(signInDialog(page)).toBeHidden()
  })

  test('the sign-in dialog focuses its first field', async ({ page }) => {
    await expect(signInDialog(page).getByPlaceholder('User Name or Email')).toBeFocused()
  })

  test('signing in through the modal opens the collection signed in', async ({ page }) => {
    // The labels aren't tied to their inputs, so the fields are found by what they show.
    await signInDialog(page).getByPlaceholder('User Name or Email').fill(USER.email)
    await signInDialog(page).getByPlaceholder('Password').fill(USER.password)
    await signInDialog(page).getByPlaceholder('Password').press('Enter')

    await expect(page.getByText('Signed in as')).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`/users/${USER.id}$`))
  })

test('Remember me keeps the sign-in for 30 days', async ({ page, context }) => {
  await signInDialog(page).getByPlaceholder('User Name or Email').fill(USER.email)
  await signInDialog(page).getByPlaceholder('Password').fill(USER.password)
  await signInDialog(page).getByLabel('Remember me').check()
  await signInDialog(page).getByPlaceholder('Password').press('Enter')

  await expect(page.getByText('Signed in as')).toBeVisible()
  const session = (await context.cookies()).find((cookie) => cookie.name === 'rack.session')
  expect(session.expires - Date.now() / 1000).toBeCloseTo(30 * 86400, -3)
})

  test('a wrong password shows the error and empties the form', async ({ page }) => {
    await signInDialog(page).getByPlaceholder('User Name or Email').fill(USER.email)
    await signInDialog(page).getByPlaceholder('Password').fill('not-the-password')
    await signInDialog(page).getByRole('button', { name: 'Sign in' }).click()

    await expect(signInDialog(page).getByText('Invalid login.')).toBeVisible()
    await expect(signInDialog(page).getByPlaceholder('User Name or Email')).toHaveValue('')
    await expect(signInDialog(page).getByPlaceholder('Password')).toHaveValue('')
  })

  test('an empty form shows the error without asking the server', async ({ page }) => {
    const posts = []
    page.on('request', (request) => { if (new URL(request.url()).pathname === '/sessions') posts.push(request) })

    await signInDialog(page).getByRole('button', { name: 'Sign in' }).click()

    await expect(signInDialog(page).getByText('Invalid login.')).toBeVisible()
    expect(posts).toHaveLength(0)
  })

  test('closing the dialog clears it', async ({ page }) => {
    await signInDialog(page).getByPlaceholder('User Name or Email').fill(USER.email)
    await signInDialog(page).getByRole('button', { name: 'Sign in' }).click()
    await expect(signInDialog(page).getByText('Invalid login.')).toBeVisible()
    await signInDialog(page).getByPlaceholder('User Name or Email').fill(USER.email)

    await signInDialog(page).getByRole('button', { name: 'Close' }).click()
    await expect(signInDialog(page)).toBeHidden()
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(signInDialog(page).getByPlaceholder('User Name or Email')).toHaveValue('')
    await expect(signInDialog(page).getByText('Invalid login.')).toBeHidden()
  })
})

test('registration says when the passwords do not match', async ({ page }) => {
  await page.goto('/users/new')
  const register = page.getByRole('button', { name: 'Register' })
  await page.locator('input[name="user[password]"]').fill('secret-one')

  await page.locator('input[name="confirm"]').pressSequentially('secret-two')

  await expect(page.getByText('Passwords do not match')).toBeVisible()
  await expect(register).toBeDisabled()

  await page.locator('input[name="confirm"]').fill('')
  await page.locator('input[name="confirm"]').pressSequentially('secret-one')

  await expect(page.getByText('Passwords do not match')).toBeHidden()
  await expect(register).toBeEnabled()
})

test.describe('signed in', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
    await page.goto(`/users/${USER.id}`)
  })

  test('Sign Out ends the session', async ({ page }) => {
    await page.locator('#menu-toggle').click()

    await page.getByRole('link', { name: 'Sign Out' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('the theme switch changes the page to the dark theme', async ({ page }) => {
    await expect(page.locator('body')).toHaveCSS('background-color', LIGHT)
    await openSettings(page)

    await flipTheme(page)

    await expect(page.locator('body')).toHaveCSS('background-color', DARK)
    await expect(themeLinks(page)).toHaveCount(1)
  })

  test('closing Account Settings puts the saved theme back', async ({ page }) => {
    await openSettings(page)
    await flipTheme(page)
    await expect(page.locator('body')).toHaveCSS('background-color', DARK)

    await settings(page).getByRole('button', { name: 'Close' }).click()

    await expect(page.locator('body')).toHaveCSS('background-color', LIGHT)
    await expect(themeLinks(page)).toHaveCount(1)
  })

  test.describe('saving', () => {
    test.afterEach(reseed)

    test('Enter in a field saves the name', async ({ page }) => {
      await openSettings(page)
      await field(page, 'first_name').fill('Edith')

      await field(page, 'first_name').press('Enter')

      await expect(settings(page)).toBeHidden()
      await expect(page.locator('.navbar-text')).toHaveText('Signed in as Edith Tester')
    })

    test('a wrong current password is refused and the fields reset', async ({ page }) => {
      await openSettings(page)
      // The new-password fields open once the current one has a value and loses focus.
      await field(page, 'current').fill('not-the-password')
      await field(page, 'current').press('Tab')
      await field(page, 'password').fill('new-password')
      await field(page, 'confirm').pressSequentially('new-password')

      await update(page).click()

      await expect(settings(page).getByText('Invalid Password.')).toBeVisible()
      await expect(field(page, 'current')).toHaveValue('')
      await expect(field(page, 'current')).toBeFocused()
      for (const name of ['password', 'confirm']) {
        await expect(field(page, name)).toHaveValue('')
        await expect(field(page, name)).toBeDisabled()
      }
      await expect(update(page)).toBeEnabled()
    })

    test('the right current password saves the new one', async ({ page }) => {
      await openSettings(page)
      await field(page, 'current').fill(USER.password)
      await field(page, 'current').press('Tab')
      // The same password again, so later tests still sign in with it.
      await field(page, 'password').fill(USER.password)
      await expect(update(page)).toBeDisabled()
      await field(page, 'confirm').pressSequentially(USER.password)
      await expect(update(page)).toBeEnabled()

      await update(page).click()

      await expect(settings(page)).toBeHidden()
    })

    test('the saved theme outlives a reload, both ways', async ({ page }) => {
      await openSettings(page)
      await flipTheme(page)
      await update(page).click()
      await expect(settings(page)).toBeHidden()
      await page.reload()
      await expect(page.locator('body')).toHaveCSS('background-color', DARK)

      await openSettings(page)
      await flipTheme(page)
      await update(page).click()
      await expect(settings(page)).toBeHidden()
      await page.reload()

      await expect(page.locator('body')).toHaveCSS('background-color', LIGHT)
    })
  })
})
