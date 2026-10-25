import { test, expect, LONG } from './fixtures.js'

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
const SIDEWAYS = { viewport: { width: 926, height: 428 }, isMobile: true, hasTouch: true }

// Visitors get the dark theme; serving one theme's stylesheet in place of the other runs a check under both.
const useTheme = (theme) => test.beforeEach(async ({ page }) => {
  const other = theme === 'dark' ? 'default' : 'dark'
  await page.route(`**/css/${other}.css*`, (route) => route.fulfill({ path: new URL(`../public/css/${theme}.css`, import.meta.url).pathname, contentType: 'text/css' }))
})

// Read from the layout rather than Playwright's boxes, which are null while the phone rail is hidden.
const railLayout = (page) => page.evaluate(() => {
  const box = (el) => { const { top, bottom, left, right } = el.getBoundingClientRect(); return { top, bottom, left, right } }
  const rail = document.getElementById('letter-rail')
  const shown = [...rail.querySelectorAll('a')].filter((link) => getComputedStyle(link).display !== 'none')
  return {
    rail: box(rail),
    letters: shown.map((link) => ({ text: link.textContent, ...box(link), size: parseFloat(getComputedStyle(link).fontSize) })),
    tiles: [...document.querySelectorAll('.index-preview')].slice(0, 30).map((tile) => box(tile)),
  }
})

// The collection's count sits in a 25px footer fixed to the bottom of the window.
const footerTop = (page) => page.locator('footer').evaluate((footer) => footer.getBoundingClientRect().top)

const letterColour = (page, letter) => page.locator(`#letter-rail a[data-letter="${letter}"]`).evaluate((link) => getComputedStyle(link).color)

const expectNoOverlaps = (letters) => {
  for (const [above, below] of letters.slice(0, -1).map((letter, i) => [letter, letters[i + 1]])) expect(above.bottom).toBeLessThanOrEqual(below.top + 0.5)
  for (const { top, bottom, size } of letters) expect(bottom - top).toBeGreaterThanOrEqual(size)
}

for (const theme of ['dark', 'default']) test.describe(`the letter rail, ${theme} theme`, () => {
  useTheme(theme)

  test.describe('in a 1500x1000 window', () => {
    test.use({ viewport: { width: 1500, height: 1000 } })

    test('runs the full height below the header at the top of the page, in the right margin', async ({ page }) => {
      await page.goto(`/users/${LONG.id}`)
      await expect(page.locator('#letter-rail')).toBeVisible()

      const { rail, letters, tiles } = await railLayout(page)
      expect(letters.map((letter) => letter.text)).toEqual(['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'])
      expect(rail.top).toBeGreaterThanOrEqual(160)
      expect(rail.top).toBeLessThan(200)
      expect(rail.bottom).toBeGreaterThan(940)
      expect(rail.bottom).toBeLessThanOrEqual(await footerTop(page))
      expect(rail.left).toBeGreaterThanOrEqual(Math.max(...tiles.map((tile) => tile.right)))
      expect(rail.right).toBeLessThanOrEqual(1500)
      expectNoOverlaps(letters)
    })

    test('draws a letter with no titles like one with titles', async ({ page }) => {
      await page.goto(`/users/${LONG.id}`)

      expect(await letterColour(page, 'q')).toBe(await letterColour(page, 'p'))
    })
  })

  test.describe('on a phone', () => {
    test.use(PHONE)

    test('runs the full height below the pinned bar without widening the page', async ({ page }) => {
      await page.goto(`/users/${LONG.id}`)

      const { rail, letters } = await railLayout(page)
      expect(rail.top).toBeGreaterThanOrEqual(50)
      expect(rail.top).toBeLessThan(70)
      expect(rail.bottom).toBeGreaterThan(790)
      expect(rail.bottom).toBeLessThanOrEqual(await footerTop(page))
      expect(rail.right).toBeLessThanOrEqual(390)
      expectNoOverlaps(letters)
      const { scrollWidth, clientWidth } = await page.evaluate(() => {
        const { scrollWidth, clientWidth } = document.documentElement
        return { scrollWidth, clientWidth }
      })
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })

    test('lays the navbar colour at half strength behind the letters', async ({ page }) => {
      await page.goto(`/users/${LONG.id}`)

      expect(await page.locator('#letter-rail').evaluate((rail) => getComputedStyle(rail).backgroundColor)).toBe('rgba(34, 34, 34, 0.5)')
    })
  })

  test.describe('on a phone held sideways', () => {
    test.use(SIDEWAYS)

    test('shows every other letter, fitting below the pinned bar', async ({ page }) => {
      await page.goto(`/users/${LONG.id}`)

      const { rail, letters } = await railLayout(page)
      expect(letters.map((letter) => letter.text)).toEqual(['#', ...'ACEGIKMOQSUWY', 'Z'])
      expect(rail.top).toBeGreaterThanOrEqual(50)
      expect(rail.bottom).toBeLessThanOrEqual(await footerTop(page))
      expectNoOverlaps(letters)
    })
  })
})

const rail = (page) => page.locator('#letter-rail')
const scrollBy = (page, screens) => page.evaluate((screens) => scrollTo(0, screens * innerHeight), screens)
const search = async (page, text) => {
  await page.locator('#search-movie-title').pressSequentially(text)
  await expect(page.locator('.footer')).toHaveText('6 Movies')
}
const clear = async (page) => {
  await page.locator('#clear-btn input').click()
  await expect(page.locator('.footer')).toHaveText('156 Movies')
}

test.describe('showing the letter rail in a 1500x1000 window', () => {
  test.use({ viewport: { width: 1500, height: 1000 } })

  test('is always shown: at the top, scrolled, still, and on a short grid', async ({ page }) => {
    await page.clock.install()
    await page.goto(`/users/${LONG.id}`)
    await expect(rail(page)).toBeVisible()

    await scrollBy(page, 3)
    await page.clock.runFor(3000)
    await expect(rail(page)).toBeVisible()

    await scrollBy(page, 0)
    await page.clock.resume()
    await search(page, 'zephyr')
    await expect(rail(page)).toBeVisible()
  })
})

test.describe('showing the letter rail on a phone', () => {
  test.use(PHONE)

  test('shows past the first screen, and hides back above it', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    await expect(rail(page)).toBeHidden()

    await scrollBy(page, 1.5)
    await expect(rail(page)).toBeVisible()
    await scrollBy(page, 0.5)
    await expect(rail(page)).toBeHidden()
  })

  test('hides for a search that leaves a short grid, and comes back after Clear', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)

    await scrollBy(page, 1.5)
    await expect(rail(page)).toBeVisible()
    await search(page, 'zephyr')
    await expect(rail(page)).toBeHidden()

    await clear(page)
    await scrollBy(page, 1.5)
    await expect(rail(page)).toBeVisible()
  })

  test('fades once scrolling has stopped for 2.5 seconds', async ({ page }) => {
    await page.clock.install()
    await page.goto(`/users/${LONG.id}`)

    await scrollBy(page, 1.5)
    await expect(rail(page)).toBeVisible()
    await page.clock.runFor(2000)
    await expect(rail(page)).toBeVisible()
    await page.clock.runFor(2000)
    await expect(rail(page)).toBeHidden()
  })
})

const letter = (page, name) => page.locator(`#letter-rail a[data-letter="${name}"]`)
const tile = (page, title) => page.locator('.index-preview').filter({ has: page.getByText(title, { exact: true }) })
const tileTop = (page, title) => tile(page, title).evaluate((el) => el.getBoundingClientRect().top)

// A jump ends with a smooth scroll; wait until the page has been still for a few frames.
const settled = (page) => page.evaluate(() => new Promise((resolve) => {
  let last = -1
  let still = 0
  const tick = () => {
    if (scrollY === last) still++
    else [last, still] = [scrollY, 0]
    if (still > 10) resolve(scrollY)
    else requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}))

test.describe('jumping to a letter in a 1500x1000 window', () => {
  test.use({ viewport: { width: 1500, height: 1000 } })

  test('M brings the row holding The Matrix, its first title, to just below the header', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)

    await letter(page, 'm').click()
    await settled(page)
    const top = await tileTop(page, 'The Matrix')
    expect(top).toBeGreaterThanOrEqual(160)
    expect(top).toBeLessThan(180)
  })

  test('A to W drops to two screens short, glides the rest, and loads only posters near W', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    await settled(page)
    const posters = []
    page.on('request', (request) => { if (request.url().includes('mzstatic.com')) posters.push(request.url()) })
    // A blocked poster falls back to a placeholder src, so each image keeps its poster's address to be found by.
    await page.evaluate(() => {
      for (const img of document.querySelectorAll('.index-preview img')) img.dataset.poster = img.getAttribute('src')
      window.positions = []
      addEventListener('scroll', () => window.positions.push(scrollY))
    })

    await letter(page, 'w').click()
    const end = await settled(page)
    const positions = await page.evaluate(() => window.positions)
    expect(Math.abs(positions[0] - (end - 2000))).toBeLessThan(5)
    expect(positions.at(-1)).toBe(end)

    expect(posters.length).toBeGreaterThan(0)
    const away = await page.evaluate((urls) => urls.map((url) => {
      const img = [...document.querySelectorAll('.index-preview img')].find((image) => image.dataset.poster === url)
      return img ? Math.max(0, -img.getBoundingClientRect().bottom, img.getBoundingClientRect().top - innerHeight) / innerHeight : Infinity
    }), posters)
    expect(Math.max(...away)).toBeLessThan(4)
  })

  test('Q, with no titles, leaves the page where it is, and Tab skips from P to R', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    await page.evaluate(() => scrollTo(0, 1234))

    // Playwright waits for an aria-disabled element to be enabled; a person can click it all the same.
    await letter(page, 'q').click({ force: true })
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => scrollY)).toBe(1234)

    await letter(page, 'p').focus()
    await page.keyboard.press('Tab')
    await expect(letter(page, 'r')).toBeFocused()
  })

  test('a clicked letter has no focus ring, and a letter reached by Tab has one', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    const outline = (name) => letter(page, name).evaluate((link) => getComputedStyle(link).outlineStyle)

    await letter(page, 'm').click()
    expect(await outline('m')).toBe('none')
    await page.keyboard.press('Tab')
    await expect(letter(page, 'n')).toBeFocused()
    expect(await outline('n')).not.toBe('none')
  })

  test('Enter on a focused letter jumps to it', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)

    await letter(page, 'm').focus()
    await page.keyboard.press('Enter')
    await settled(page)
    expect(await tileTop(page, 'The Matrix')).toBeLessThan(180)
    expect(page.url()).not.toContain('#')
  })

  test('a letter chosen with a drawer open closes the drawer first', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    await tile(page, 'Amber').locator('a').click()
    await expect(page.locator('#movie-list > .info')).toBeVisible()

    await letter(page, 'm').click()
    await settled(page)
    await expect(page.locator('#movie-list > .info')).toHaveCount(0)
    expect(await tileTop(page, 'The Matrix')).toBeLessThan(180)
  })
})

test.describe('jumping to a letter on a phone', () => {
  test.use(PHONE)

  test('M brings The Matrix to just below the pinned bar', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    await scrollBy(page, 1.5)
    await expect(rail(page)).toBeVisible()

    await letter(page, 'm').tap()
    await settled(page)
    const top = await tileTop(page, 'The Matrix')
    expect(top).toBeGreaterThanOrEqual(50)
    expect(top).toBeLessThan(70)
  })

  test('dragging from A to M follows the finger and ends at M', async ({ page }) => {
    await page.goto(`/users/${LONG.id}`)
    await scrollBy(page, 1.5)
    await expect(rail(page)).toBeVisible()
    const centre = async (name) => {
      const box = await letter(page, name).boundingBox()
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    }
    const from = await centre('a')
    const to = await centre('m')
    const touch = await page.context().newCDPSession(page)

    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
    for (let step = 1; step <= 12; step++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x, y: from.y + (to.y - from.y) * step / 12 }] })
    }
    await expect(rail(page)).toBeVisible()
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await settled(page)

    const top = await tileTop(page, 'The Matrix')
    expect(top).toBeGreaterThanOrEqual(50)
    expect(top).toBeLessThan(70)
  })
})
