import { test, expect, USER, reseed, signIn } from './fixtures.js'

const signInDialog = (page) => page.getByRole('dialog').filter({ hasText: 'Sign in!' })
// Account Settings replaces the sign-in form inside the same Bootstrap modal.
const settings = (page) => page.locator('#logIn')
const field = (page, name) => settings(page).locator(`input[name="${name}"]`)
const update = (page) => settings(page).getByRole('button', { name: 'Update' })
const stylesheets = (page) => page.locator('link[rel="stylesheet"]')
const LIGHT = 'rgb(234, 234, 234)'
const DARK = 'rgb(43, 43, 43)'

const openSettings = async (page) => {
  await page.locator('#menu-toggle').click()
  await page.getByRole('link', { name: 'Account Settings' }).click()
  await expect(field(page, 'first_name')).toBeVisible()
}
// Bootstrap hides each radio inside its button; the button is what a user clicks.
const pickTheme = (page, name) => settings(page).locator('.theme-choice label', { hasText: name }).click()
const background = (page) => page.locator('body')

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

  test('the sign-in fields tell a password manager they hold the account and its password', async ({ page }) => {
    await expect(signInDialog(page).getByLabel('User Name or Email:')).toHaveAttribute('autocomplete', 'username')
    await expect(signInDialog(page).getByLabel('Password:', { exact: true })).toHaveAttribute('autocomplete', 'current-password')
  })

  test('the sign-in dialog focuses its first field', async ({ page }) => {
    await expect(signInDialog(page).getByPlaceholder('User Name or Email')).toBeFocused()
  })

  test('signing in through the modal opens the collection signed in', async ({ page }) => {
    await signInDialog(page).getByLabel('User Name or Email:').fill(USER.email)
    await signInDialog(page).getByLabel('Password:', { exact: true }).fill(USER.password)
    await signInDialog(page).getByLabel('Password:', { exact: true }).press('Enter')

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

  test("a visitor's page follows the device's light or dark setting", async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(background(page)).toHaveCSS('background-color', DARK)

    await page.emulateMedia({ colorScheme: 'light' })

    await expect(background(page)).toHaveCSS('background-color', LIGHT)
  })

  for (const theme of ['dark', 'default']) {
    test(`Remember me lines up with the fields and shares their border (${theme} theme)`, async ({ page }) => {
      // A visitor is on System, so the device's setting picks the theme.
      await page.emulateMedia({ colorScheme: theme === 'dark' ? 'dark' : 'light' })
      const password = signInDialog(page).getByPlaceholder('Password')
      const remember = signInDialog(page).getByLabel('Remember me')

      expect((await remember.boundingBox()).x).toBeCloseTo((await password.boundingBox()).x, 0)
      // Both borders ease to the new theme's colour over 0.15s, so a single read can land mid-transition; toHaveCSS retries.
      const edge = theme === 'dark' ? 'rgb(85, 85, 85)' : 'rgb(204, 204, 204)'
      await expect(password).toHaveCSS('border-top-color', edge)
      await expect(remember).toHaveCSS('border-top-color', edge)
    })
  }

  test('sign-in on a dark device is a dark box under the red header', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })

    await expect(signInDialog(page).locator('.modal-content')).toHaveCSS('background-color', 'rgb(34, 34, 34)')
    await expect(signInDialog(page).getByPlaceholder('Password')).toHaveCSS('background-color', 'rgb(43, 43, 43)')
    await expect(signInDialog(page).locator('.modal-header')).toHaveCSS('background-color', 'rgb(217, 83, 79)')
  })

  test("Remember me is the browser's own checkbox in high-contrast mode", async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })

    const remember = signInDialog(page).getByLabel('Remember me')
    expect(await remember.evaluate((el) => getComputedStyle(el).appearance)).toBe('auto')
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

test('the sign-up panel keeps white fields on a dark device', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/users/new')

  await expect(page.locator('input[name="user[password]"]')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(page.getByRole('button', { name: 'Register' })).toHaveCSS('background-color', 'rgb(255, 255, 255)')
})

test('registration names its fields and asks for a new password of at least 8 characters', async ({ page }) => {
  await page.goto('/users/new')
  const hints = { 'First Name:': 'given-name', 'Last Name:': 'family-name', 'User name:': 'username', 'Email:': 'email', 'Password:': 'new-password', 'Confirm Password:': 'new-password' }

  // The layout's hidden sign-in dialog has its own "Password:" field.
  const form = page.locator('.registration')

  for (const [label, hint] of Object.entries(hints)) {
    await expect(form.getByLabel(label, { exact: true })).toHaveAttribute('autocomplete', hint)
  }
  await expect(form.getByLabel('Password:', { exact: true })).toHaveAttribute('placeholder', 'At least 8 characters')
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

  test('Account Settings names its fields and says when the current password is needed', async ({ page }) => {
    await openSettings(page)
    const hints = { 'First Name:': 'given-name', 'Last Name:': 'family-name', 'User name:': 'username', 'Email:': 'email', 'Current Password:': 'current-password', 'New Password:': 'new-password', 'Confirm Password:': 'new-password' }

    for (const [label, hint] of Object.entries(hints)) {
      await expect(settings(page).getByLabel(label, { exact: true })).toHaveAttribute('autocomplete', hint)
    }
    await expect(settings(page).getByLabel('Current Password:')).toHaveAttribute('placeholder', 'Only needed to change your password')
    await expect(settings(page).getByLabel('New Password:')).toHaveAttribute('placeholder', 'At least 8 characters')

    await settings(page).getByText('Current Password:').click()

    await expect(field(page, 'current')).toBeFocused()
  })

  test('picking Dark changes the page to the dark theme', async ({ page }) => {
    await expect(background(page)).toHaveCSS('background-color', LIGHT)
    await openSettings(page)

    await pickTheme(page, 'Dark')

    await expect(background(page)).toHaveCSS('background-color', DARK)
    await expect(stylesheets(page)).toHaveCount(1)
  })

  test('picking System follows the device', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await openSettings(page)

    await pickTheme(page, 'System')

    await expect(background(page)).toHaveCSS('background-color', DARK)
  })

  test('Account Settings turns dark with the theme: box, raised fields and buttons', async ({ page }) => {
    await openSettings(page)

    await pickTheme(page, 'Dark')

    await expect(settings(page).locator('.modal-content')).toHaveCSS('background-color', 'rgb(34, 34, 34)')
    await expect(settings(page).locator('.modal-content')).toHaveCSS('color', 'rgb(243, 243, 243)')
    await expect(field(page, 'first_name')).toHaveCSS('background-color', 'rgb(43, 43, 43)')
    await expect(field(page, 'first_name')).toHaveCSS('border-top-color', 'rgb(85, 85, 85)')
    await expect(field(page, 'password')).toHaveCSS('background-color', 'rgb(34, 34, 34)')
    await expect(settings(page).locator('.theme-choice label', { hasText: 'Light' })).toHaveCSS('background-color', 'rgb(43, 43, 43)')
    await expect(settings(page).locator('.theme-choice label', { hasText: 'Dark' })).toHaveCSS('background-color', 'rgb(58, 58, 58)')
  })

  test('an open Account Settings follows the device on System, without a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await openSettings(page)
    await pickTheme(page, 'System')
    await expect(field(page, 'first_name')).toHaveCSS('background-color', 'rgb(255, 255, 255)')

    await page.emulateMedia({ colorScheme: 'dark' })

    await expect(settings(page).locator('.modal-content')).toHaveCSS('background-color', 'rgb(34, 34, 34)')
    await expect(field(page, 'first_name')).toHaveCSS('background-color', 'rgb(43, 43, 43)')
  })

  test('closing Account Settings puts the saved theme back', async ({ page }) => {
    await openSettings(page)
    await pickTheme(page, 'Dark')
    await expect(background(page)).toHaveCSS('background-color', DARK)

    await settings(page).getByRole('button', { name: 'Close' }).click()

    await expect(background(page)).toHaveCSS('background-color', LIGHT)
    await expect(stylesheets(page)).toHaveCount(1)
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

      await expect(settings(page).getByText("Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.")).toBeVisible()
      await expect(field(page, 'current')).toHaveValue('')
      await expect(field(page, 'current')).toBeFocused()
      for (const name of ['password', 'confirm']) {
        await expect(field(page, name)).toHaveValue('')
        await expect(field(page, name)).toBeDisabled()
      }
      await expect(update(page)).toBeEnabled()
    })

    test('a new password under 8 characters holds Update and says so', async ({ page }) => {
      await openSettings(page)
      await field(page, 'current').fill(USER.password)
      await field(page, 'current').press('Tab')

      await field(page, 'password').fill('seven77')
      await field(page, 'confirm').pressSequentially('seven77')

      await expect(settings(page).getByText('Use at least 8 characters')).toBeVisible()
      await expect(update(page)).toBeDisabled()
    })

    // The page counts characters, not bytes, so the server is what refuses this one.
    test('a new password over 72 bytes is refused by the server', async ({ page }) => {
      await openSettings(page)
      await field(page, 'current').fill(USER.password)
      await field(page, 'current').press('Tab')
      await field(page, 'password').fill('x'.repeat(73))
      await field(page, 'confirm').fill('x'.repeat(73))

      await update(page).click()

      await expect(settings(page).getByText("Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.")).toBeVisible()
    })

    test("an email another account has isn't saved, and the dialog says so", async ({ page }) => {
      await openSettings(page)
      await field(page, 'email').fill('other@example.test')

      await update(page).click()

      await expect(settings(page).getByText("Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.")).toBeVisible()
      await page.reload()
      await openSettings(page)
      await expect(field(page, 'email')).toHaveValue(USER.email)
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
      await pickTheme(page, 'Dark')
      await update(page).click()
      await expect(settings(page)).toBeHidden()
      await page.reload()
      await expect(background(page)).toHaveCSS('background-color', DARK)

      await openSettings(page)
      await pickTheme(page, 'Light')
      await update(page).click()
      await expect(settings(page)).toBeHidden()
      await page.reload()

      await expect(background(page)).toHaveCSS('background-color', LIGHT)
    })

    test('a saved System theme follows the device, and changes with it without a reload', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await openSettings(page)
      await pickTheme(page, 'System')
      await update(page).click()
      await expect(settings(page)).toBeHidden()
      await page.reload()
      await expect(background(page)).toHaveCSS('background-color', DARK)

      await page.emulateMedia({ colorScheme: 'light' })

      await expect(background(page)).toHaveCSS('background-color', LIGHT)
    })
  })
})
