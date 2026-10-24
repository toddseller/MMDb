import { test, expect, USER, signIn } from './fixtures.js'

test.describe('signed in', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
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
