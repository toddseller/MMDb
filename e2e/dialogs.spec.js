import { test, expect, USER } from './fixtures.js'

const signInDialog = (page) => page.locator('#logIn')
// The dialog has its own Sign in button, so the navbar's is found inside the navbar.
const signInButton = (page) => page.locator('#sign-in').getByRole('button', { name: 'Sign in' })
const movieDialog = (page) => page.locator('#movie')
const isOpen = (dialog) => dialog.evaluate((element) => element.open)

// Escape in the same frame as the click would find no fade to run yet, which no person is quick enough to do.
const faded = (dialog) => expect.poll(() => dialog.evaluate((element) =>
  [element, element.querySelector('.modal-dialog')].flatMap((el) => el?.getAnimations() ?? []).length)).toBe(0)

const openSignIn = async (page) => {
  await signInButton(page).click()
  await expect(signInDialog(page)).toBeVisible()
  await faded(signInDialog(page))
}

const previewMovie = async (page) => {
  await page.goto('/')
  await page.locator('.top-preview img').first().click()
  await expect(movieDialog(page).locator('.modal-title')).toBeVisible()
}

test.describe('signed out on a collection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/users/${USER.id}`)
  })

  test('Escape fades the dialog out before it closes', async ({ page }) => {
    await openSignIn(page)

    await page.keyboard.press('Escape')

    expect(await isOpen(signInDialog(page))).toBe(true)
    await expect(signInDialog(page)).toBeHidden()
  })

  test('with reduced motion, Escape closes at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openSignIn(page)

    await page.keyboard.press('Escape')

    expect(await isOpen(signInDialog(page))).toBe(false)
  })

  test('closing sign-in with Escape clears it', async ({ page }) => {
    await openSignIn(page)
    await signInDialog(page).getByRole('button', { name: 'Sign in' }).click()
    await expect(signInDialog(page).locator('.login-errors')).toBeVisible()
    await signInDialog(page).getByPlaceholder('User Name or Email').fill('typed')

    await page.keyboard.press('Escape')
    await expect(signInDialog(page)).toBeHidden()
    await openSignIn(page)

    await expect(signInDialog(page).getByPlaceholder('User Name or Email')).toHaveValue('')
    await expect(signInDialog(page).locator('.login-errors')).toBeHidden()
  })

  test('closing returns focus to what opened the dialog', async ({ page }) => {
    await signInButton(page).focus()
    await page.keyboard.press('Enter')
    await expect(signInDialog(page)).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(signInDialog(page)).toBeHidden()
    await expect(signInButton(page)).toBeFocused()
  })

  test('the page behind does not scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 300))
    await openSignIn(page)
    const before = await page.evaluate(() => window.scrollY)

    await page.mouse.move(10, 890)
    await page.mouse.wheel(0, 600)
    // Nothing to wait for if the page stays put, so give a scroll the time it would take.
    await page.waitForTimeout(300)

    expect(await page.evaluate(() => window.scrollY)).toBe(before)
    // Where the scrollbar takes up space, hiding it would shift the page; headless Chromium has none to show it.
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter)).toBe('stable')
  })

  test('Tab never reaches the page behind', async ({ page }) => {
    await openSignIn(page)

    // Past the dialog's last control focus rests on the body, the browser's own toolbar in a real window.
    for (const key of [...Array(10).fill('Tab'), ...Array(10).fill('Shift+Tab')]) {
      await page.keyboard.press(key)
      expect(await page.evaluate(() => document.activeElement === document.body || Boolean(document.activeElement?.closest('#logIn')))).toBe(true)
    }
  })
})

test('a click beside a dialog leaves it open', async ({ page }) => {
  await previewMovie(page)

  await page.mouse.click(10, 890)
  // A close would take the fade's .3s; waiting past it shows the dialog stayed.
  await page.waitForTimeout(500)

  await expect(movieDialog(page)).toBeVisible()
})

test('the close button closes a dialog', async ({ page }) => {
  await previewMovie(page)

  await movieDialog(page).getByRole('button', { name: 'Close' }).click()

  await expect(movieDialog(page)).toBeHidden()
})
