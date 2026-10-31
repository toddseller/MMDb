import { test, expect, USER } from './fixtures.js'

// Linux and Windows scrollbars take up 15px, which the page always reserves, so the page is narrower than the window.
// Headless Chromium hides scrollbars and macOS overlays them; a styled one, without --hide-scrollbars, takes the space
// everywhere. Its own file, as Playwright launches the browser once per file for launch options.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

for (const width of [1500, 2560]) {
  test.describe(`in a ${width}px window with a scrollbar that takes space`, () => {
    // Short enough for the page to scroll, so the styled scrollbar is drawn.
    test.use({ viewport: { width, height: 900 } })

    test("a drawer's details are 1170px wide, centered in the page", async ({ page }) => {
      // Added to the served stylesheet, as an inline <style> would be a policy violation.
      await page.route('**/css/responsive.css*', async (route) => {
        const response = await route.fetch()
        await route.fulfill({ response, body: `${await response.text()}\n::-webkit-scrollbar { width: 15px }` })
      })
      await page.goto(`/users/${USER.id}`)
      const pageWidth = await page.evaluate(() => document.documentElement.clientWidth)
      expect(pageWidth).toBe(width - 15)

      await page.locator('#movie-list > .index-preview a').nth(1).click()

      await expect(page.getByText('Birch is a seeded movie.')).toBeVisible()
      const details = await page.locator('.info #meta-data').boundingBox()
      expect(details.width).toBeCloseTo(1170, 0)
      expect(details.x + details.width / 2).toBeCloseTo(pageWidth / 2, 0)
    })
  })
}
