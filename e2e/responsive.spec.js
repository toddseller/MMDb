import { test, expect, USER, OTHER, signIn } from './fixtures.js'

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }

// clientWidth is the layout viewport; on a phone innerWidth grows to fit a page that is too wide.
const expectNoSidewaysScroll = async (page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement
    return { scrollWidth, clientWidth }
  })
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

const browsingPages = [
  { name: 'the home page', path: '/' },
  { name: "a signed-in user's movies", path: `/users/${USER.id}`, signedIn: true },
  { name: "a signed-in user's shows", path: `/users/${USER.id}/shows`, signedIn: true },
  { name: "another user's movies", path: `/users/${OTHER.id}`, signedIn: true },
  { name: "a visitor's view of a collection", path: `/users/${USER.id}` },
  { name: "a movie collection's own page", path: `/users/${USER.id}/movies` },
]

const sideMargins = (page) => page.evaluate(() => {
  const style = getComputedStyle(document.body)
  return [parseFloat(style.paddingLeft), parseFloat(style.paddingRight)]
})

// Counted from the grid's tracks, not its tiles, so a collection too small to fill a row still shows how many would fit.
const columns = (page, grid) => page.locator(grid).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)

const MOVIES = { path: `/users/${USER.id}`, grid: '#movie-list', tile: '#movie-list > .index-preview', title: '.truncate', shape: 1.5 }
const SHOWS = { path: `/users/${USER.id}/shows`, grid: '#show-list', tile: '#show-list > .index-preview-show', title: '.show-truncate', shape: 1 }

for (const width of [1500, 2560]) {
  test.describe(`in a ${width}px window`, () => {
    test.use({ viewport: { width, height: 1440 } })

    test("a show drawer's poster keeps its 447px size", async ({ page }) => {
      // A square stand-in for Apple's blocked artwork, so the poster has a real size to fit.
      await page.route('https://is1-ssl.mzstatic.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"/>' }))
      await page.goto(SHOWS.path)

      await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Tide Tables Poster"]') }).click()

      const poster = page.locator('#info-header .description-poster img')
      await expect(poster).toBeVisible()
      const box = await poster.boundingBox()
      expect([box.width, box.height]).toEqual([447, 447])
      const details = await page.locator('#info-header > .series-info').boundingBox()
      expect(box.x + box.width).toBeLessThanOrEqual(details.x)
    })
  })
}

for (const { width, movies, shows } of [{ width: 2560, movies: 10, shows: 9 }, { width: 2545, movies: 10, shows: 9 }]) {
  test.describe(`in a ${width}px window`, () => {
    test.use({ viewport: { width, height: 1440 } })

    test(`rows hold ${movies} movies and ${shows} shows`, async ({ page }) => {
      await page.goto(MOVIES.path)
      expect(await columns(page, MOVIES.grid)).toBe(movies)

      await page.goto(SHOWS.path)
      expect(await columns(page, SHOWS.grid)).toBe(shows)
    })
  })
}

for (const { width, margin } of [{ width: 1500, margin: 40 }, { width: 2560, margin: 202.4 }, { width: 3840, margin: 376 }]) {
  test.describe(`in a ${width}px window`, () => {
    test.use({ viewport: { width, height: 1000 } })

    test(`the side margins are ${margin}px`, async ({ page }) => {
      await page.goto(`/users/${USER.id}`)

      const [left, right] = await sideMargins(page)
      expect(left).toBeCloseTo(margin, 0)
      expect(right).toBeCloseTo(margin, 0)
    })
  })
}

// The full-size poster is never answered, so the drawer is measured as it is while that poster loads.
const holdPosters = (page) => page.route('https://is1-ssl.mzstatic.com/**', (route) => {
  if (/\/(2000x3000|600x600)\.jpg$/.test(route.request().url())) return
  return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"/>' })
})

const DRAWERS = [
  { ...MOVIES, name: 'movie', poster: 'Birch Poster', heading: '#meta-data .modal-title', size: [340, 510] },
  { ...SHOWS, name: 'show', poster: 'Tide Tables Poster', heading: '#info-header h1', size: [447, 447] },
]
const drawerPoster = (page) => page.locator('#meta-data .description-poster img')

test.describe('in a 1500px window, while the poster loads', () => {
  test.use({ viewport: { width: 1500, height: 900 } })

  for (const drawer of DRAWERS) {
    test(`a ${drawer.name} drawer's poster already has its ${drawer.size.join('x')} size`, async ({ page }) => {
      await holdPosters(page)
      await page.goto(drawer.path)

      await page.locator(`${drawer.tile} a`).filter({ has: page.locator(`img[alt="${drawer.poster}"]`) }).click()

      await expect(page.locator(drawer.heading)).toBeVisible()
      const box = await drawerPoster(page).boundingBox()
      expect([box.width, box.height]).toEqual(drawer.size)
    })
  }

  // The fixture aborts every outside request, so these posters fail; Harbor Lights' seasons have none at all.
  for (const drawer of [...DRAWERS, { ...SHOWS, name: 'show with no season poster', poster: 'Harbor Lights Poster', heading: '#info-header h1', size: [447, 447] }]) {
    test(`a ${drawer.name}'s drawer poster that fails keeps its ${drawer.size.join('x')} size`, async ({ page }) => {
      await page.goto(drawer.path)

      await page.locator(`${drawer.tile} a`).filter({ has: page.locator(`img[alt="${drawer.poster}"]`) }).click()

      await expect(drawerPoster(page)).toHaveJSProperty('complete', true)
      const box = await drawerPoster(page).boundingBox()
      expect([box.width, box.height]).toEqual(drawer.size)
    })
  }

  test("a portrait show poster keeps the drawer's square", async ({ page }) => {
    await page.route('https://is1-ssl.mzstatic.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"/>' }))
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Tide Tables Poster"]') }).click()

    await expect(drawerPoster(page)).toHaveJSProperty('complete', true)
    const box = await drawerPoster(page).boundingBox()
    expect([box.width, box.height]).toEqual([447, 447])
  })
})

test.describe('on a phone, while the poster loads', () => {
  test.use(PHONE)

  for (const drawer of DRAWERS) {
    test(`a ${drawer.name} drawer's title already sits below the poster's full box`, async ({ page }) => {
      await holdPosters(page)
      await page.goto(drawer.path)

      await page.locator(`${drawer.tile} a`).filter({ has: page.locator(`img[alt="${drawer.poster}"]`) }).tap()

      await expect(page.locator(drawer.heading)).toBeVisible()
      // One frame for both, as the drawer may still be gliding into view.
      const [poster, headingTop] = await page.evaluate((heading) => [
        document.querySelector('#meta-data .description-poster img').getBoundingClientRect().toJSON(),
        document.querySelector(heading).getBoundingClientRect().top,
      ], drawer.heading)
      expect(poster.height).toBeCloseTo(poster.width * drawer.size[1] / drawer.size[0], 0)
      expect(headingTop).toBeGreaterThanOrEqual(poster.bottom)
    })
  }
})

// Between 1200px and about 1500px the show drawer's poster column is narrower than its 447px poster.
test.describe('in a 1300px window', () => {
  test.use({ viewport: { width: 1300, height: 900 } })

  test("a show drawer's poster stays clear of the details beside it", async ({ page }) => {
    await page.route('https://is1-ssl.mzstatic.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"/>' }))
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Tide Tables Poster"]') }).click()

    const poster = page.locator('#info-header .description-poster img')
    await expect(poster).toBeVisible()
    const box = await poster.boundingBox()
    const details = await page.locator('#info-header > .series-info p').first().boundingBox()
    expect(box.x + box.width).toBeLessThanOrEqual(details.x)
  })
})

// A phone on its side is wider than the phone layout, but too narrow for the show drawer's side-by-side columns.
test.describe('on a phone held sideways', () => {
  test.use({ viewport: { width: 926, height: 428 }, isMobile: true, hasTouch: true })

  test("a show drawer's runtimes and more links stay on screen, with more below its plot", async ({ page }) => {
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Harbor Lights Poster"]') }).tap()

    await expect(page.locator('.episode-description').first()).toBeVisible()
    for (const selector of ['.episode-runtime', '.expand-plot']) {
      const box = await page.locator(selector).first().boundingBox()
      expect(box.x + box.width, selector).toBeLessThanOrEqual(926)
    }
    // One frame for both, as the drawer may still be gliding into view.
    const [plotBottom, moreTop] = await page.evaluate(() => [
      document.querySelector('.plot-truncate').getBoundingClientRect().bottom,
      document.querySelector('.expand-plot').getBoundingClientRect().top,
    ])
    expect(moreTop).toBeGreaterThanOrEqual(plotBottom)
  })

  test('pins only the compact bar, so the filters scroll away', async ({ page }) => {
    await signIn(page)
    await page.goto(MOVIES.path)

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

    for (const selector of ['#header-logo', '#search-movie-title', '#menu-toggle']) {
      const box = await page.locator(selector).boundingBox()
      expect(box.y, selector).toBeGreaterThanOrEqual(0)
      expect(box.y + box.height, selector).toBeLessThanOrEqual(50)
    }
    await expect(page.locator('#library')).not.toBeInViewport()
  })

  for (const grid of [MOVIES, SHOWS]) {
    test(`a ${grid === MOVIES ? 'movie' : 'show'} drawer's details keep the page's side margins`, async ({ page }) => {
      await page.goto(grid.path)

      await page.locator(`${grid.tile} a`).nth(1).tap()

      const details = page.locator(grid === MOVIES ? '.info .description-details' : '.info .series-info')
      await expect(details).toBeVisible()
      const text = await details.locator(grid === MOVIES ? '.description-plot' : 'p').first().boundingBox()
      expect(text.x).toBeGreaterThanOrEqual(40)
      expect(text.x + text.width).toBeLessThanOrEqual(926 - 40)
    })
  }
})

test.describe('turning a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  // Right under the open poster's row, and that row full: a drawer left where it was splits a row or sits under another.
  const drawerEndsItsRow = (page) => page.evaluate(() => {
    const list = /** @type {HTMLElement} */ (document.getElementById('movie-list'))
    const drawer = /** @type {HTMLElement} */ (list.querySelector('.info'))
    const open = /** @type {HTMLElement} */ (list.querySelector('.index-preview.open'))
    const columns = getComputedStyle(list).gridTemplateColumns.split(' ').length
    const row = [...list.querySelectorAll('.index-preview')].filter((tile) => /** @type {HTMLElement} */ (tile).offsetTop === open.offsetTop)
    return row.at(-1) === drawer.previousElementSibling && (row.length === columns || !drawer.nextElementSibling)
  })

  // iPhone Safari resizes the window as its address bar grows and shrinks during a scroll; only the height changes.
  test('leaves an open drawer alone when only the height changes', async ({ page }) => {
    await signIn(page)
    await page.goto(MOVIES.path)
    await page.locator(`${MOVIES.tile} a`).nth(1).tap()
    const star = page.locator('.info #ratings-container input').first()
    await star.focus()

    await page.setViewportSize({ width: 390, height: 760 })
    // The resize event arrives after the viewport changes, so give it two frames to run.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

    await expect(star).toBeFocused()
  })

  for (const [from, to] of [[{ width: 390, height: 844 }, { width: 926, height: 428 }], [{ width: 926, height: 428 }, { width: 390, height: 844 }]]) {
    test(`moves an open drawer to the end of its poster's row, from ${from.width} to ${to.width}px wide`, async ({ page }) => {
      await page.setViewportSize(from)
      await page.goto(MOVIES.path)
      await page.locator(`${MOVIES.tile} a`).nth(1).tap()
      await expect(page.getByText('Birch is a seeded movie.')).toBeVisible()

      await page.setViewportSize(to)

      await expect.poll(() => drawerEndsItsRow(page)).toBe(true)
    })
  }
})

// The server picks a theme by session (visitors get dark, the seeded user default), so every phone check is run with
// each theme's stylesheet served in place of the other's, so each theme's colours are checked.
for (const theme of ['dark', 'default']) test.describe(`on a phone, ${theme} theme`, () => {
  test.use(PHONE)

  test.beforeEach(async ({ page }) => {
    const other = theme === 'dark' ? 'default' : 'dark'
    await page.route(`**/css/${other}.css*`, (route) => route.fulfill({ path: new URL(`../public/css/${theme}.css`, import.meta.url).pathname, contentType: 'text/css' }))
  })

  test('the side margins are 16px', async ({ page }) => {
    await page.goto(`/users/${USER.id}`)

    expect(await sideMargins(page)).toEqual([16, 16])
  })

  test("a movie drawer's rating, format and stars sit side by side", async ({ page }) => {
    await signIn(page)
    await page.goto(`/users/${USER.id}`)
    await page.locator('#movie-list img[alt="Birch Poster"]').tap()
    await expect(page.locator('.info.open')).toBeVisible()

    const boxes = await page.locator('.info .description-info').evaluate((row) =>
      [...row.querySelectorAll(':scope > :not(#ratings-container), #ratings-container span, #ratings-container p')]
        .map((el) => el.getBoundingClientRect())
        .filter((box) => box.width && box.height)
        .map(({ left, right, top, bottom }) => ({ left, right, top, bottom })))
    const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
    expect(boxes.length).toBeGreaterThan(1)
    expect(boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => overlap(a, b)).map((b) => [a, b]))).toEqual([])
  })

  for (const { name, path, signedIn } of browsingPages) {
    test(`${name} doesn't scroll sideways`, async ({ page }) => {
      if (signedIn) await signIn(page)
      await page.goto(path)

      await expectNoSidewaysScroll(page)
    })
  }

  for (const [name, grid, perRow] of [['movies', MOVIES, 3], ['shows', SHOWS, 2]]) {
    test(`${name} sit ${perRow} to a row, keeping their shape, with titles inside their tiles`, async ({ page }) => {
      await page.goto(grid.path)

      expect(await columns(page, grid.grid)).toBe(perRow)
      const tile = page.locator(grid.tile).first()
      const poster = await tile.locator('img').boundingBox()
      expect(poster.height / poster.width).toBeCloseTo(grid.shape, 1)
      const box = await tile.boundingBox()
      const title = await tile.locator(grid.title).boundingBox()
      expect(title.x).toBeGreaterThanOrEqual(box.x)
      expect(title.x + title.width).toBeLessThanOrEqual(box.x + box.width)
    })
  }

  // Off-screen tiles are skipped at a guessed size; a wrong guess makes the page grow or shrink as they come into view.
  // 740px is a phone held sideways, still in the phone layout, where tiles are about twice as tall as at 390px.
  for (const width of [390, 740]) {
    test(`scrolling through the movies at ${width}px keeps the page the same height`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(MOVIES.path)
      const height = () => page.evaluate(() => document.documentElement.scrollHeight)
      const before = await height()

      // Wheel steps draw every row on the way down; jumping to the end would skip the rows between.
      while (await page.evaluate(() => scrollY + innerHeight < document.documentElement.scrollHeight - 1)) {
        await page.mouse.wheel(0, 600)
        await page.evaluate(() => new Promise(requestAnimationFrame))
      }

      expect(Math.abs(await height() - before)).toBeLessThan(20)
    })
  }

  test.describe('the pinned bar', () => {
    const NAVBAR = 50
    const overlap = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
    const expectInBar = async (page, selectors) => {
      const boxes = []
      for (const selector of selectors) {
        const el = page.locator(selector)
        await expect(el).toBeInViewport({ ratio: 1 })
        const box = await el.boundingBox()
        expect(box.y + box.height, selector).toBeLessThanOrEqual(NAVBAR)
        boxes.push([selector, box])
      }
      for (const [i, [a, boxA]] of boxes.entries()) {
        for (const [b, boxB] of boxes.slice(i + 1)) expect(overlap(boxA, boxB), `${a} overlaps ${b}`).toBe(false)
      }
    }

    test('keeps search and the menu at the top while the filters scroll away', async ({ page }) => {
      await signIn(page)
      await page.goto(MOVIES.path)

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))

      await expectInBar(page, ['#header-logo', '#search-movie-title', '#clear-btn', '#menu-toggle'])
      await expect(page.locator('#library')).not.toBeInViewport()
    })

    test('searches as on desktop', async ({ page }) => {
      await page.goto(MOVIES.path)

      await page.getByPlaceholder('Search Collection').pressSequentially('amb')

      await expect(page.locator(MOVIES.tile)).toHaveCount(1)
      await expect(page.locator(MOVIES.tile).locator('p')).toHaveText('Amber')
    })

    test("holds a visitor's Sign in button beside the search", async ({ page }) => {
      await page.goto(MOVIES.path)

      await expectInBar(page, ['#header-logo', '#search-movie-title', '#clear-btn', '#open-sign-in'])
    })

    test('hides "Signed in as"', async ({ page }) => {
      await signIn(page)
      await page.goto(MOVIES.path)

      await expect(page.getByText('Signed in as')).toBeHidden()
    })
  })

  test('the menu opens within the screen and switches to TV shows', async ({ page }) => {
    await signIn(page)
    await page.goto(MOVIES.path)

    await page.locator('#menu-toggle').tap()
    await page.getByText('Profile').tap()

    const menu = page.locator('#drop-down')
    await expect(menu.getByRole('link', { name: 'Movies' })).toBeInViewport({ ratio: 1 })
    await expect(menu.getByRole('link', { name: 'TV Shows' })).toBeInViewport({ ratio: 1 })
    await menu.getByRole('link', { name: 'TV Shows' }).tap()
    await expect(page.locator(SHOWS.tile).first()).toBeVisible()
  })

  const expectAcrossScreen = async (locator) => {
    const box = await locator.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(PHONE.viewport.width)
    return box
  }

  test("a movie's drawer stacks its poster above its title", async ({ page }) => {
    await page.goto(MOVIES.path)

    await page.locator(`${MOVIES.tile} a`).nth(1).tap()

    const drawer = page.locator('.info')
    await expect(drawer.getByText('Birch is a seeded movie.')).toBeVisible()
    await expectAcrossScreen(drawer.locator('.description-poster img').first())
    await expectAcrossScreen(drawer.locator('.modal-title'))
    // One frame for both: the page may still be gliding the drawer into view, which moves everything between reads.
    const [posterBottom, titleTop] = await drawer.evaluate((info) => [
      info.querySelector('.description-poster img').getBoundingClientRect().bottom,
      info.querySelector('.modal-title').getBoundingClientRect().top,
    ])
    expect(posterBottom).toBeLessThanOrEqual(titleTop)
    await expectNoSidewaysScroll(page)
  })

  // Amber has a studio, whose section draws a fixed-width rule under its heading.
  test("a drawer's details fit the screen when the movie has a studio", async ({ page }) => {
    await page.goto(MOVIES.path)

    await page.locator(`${MOVIES.tile} a`).first().tap()

    const drawer = page.locator('.info')
    await expect(drawer.getByText('Amber is a seeded movie.')).toBeVisible()
    await expectAcrossScreen(drawer.locator('.description-plot'))
    await expectAcrossScreen(drawer.locator('.description-info'))
    for (const rule of await drawer.locator('hr').all()) await expectAcrossScreen(rule)
  })

  test("a drawer's badges and stars keep their size and stay in one piece", async ({ page }) => {
    await page.goto(MOVIES.path)

    await page.locator(`${MOVIES.tile} a`).nth(1).tap()

    const info = page.locator('.info .description-info')
    await expect(info).toBeVisible()
    const hd = await info.locator('svg[width="26"]').boundingBox()
    expect(hd.width).toBe(26)
    const stars = await info.locator('#ratings-container label, #ratings-container .glyphicon-rating').evaluateAll((labels) => labels.map((label) => label.getBoundingClientRect().top))
    expect(stars).toHaveLength(5)
    expect(new Set(stars).size).toBe(1)
  })

  test("an owner's show drawer keeps the edit button off the poster", async ({ page }) => {
    await page.route('https://is1-ssl.mzstatic.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"/>' }))
    await signIn(page)
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Tide Tables Poster"]') }).tap()

    const poster = page.locator('#info-header .description-poster img')
    await expect(poster).toBeVisible()
    const edit = await page.locator('#info-header > .show-edit').boundingBox()
    const art = await poster.boundingBox()
    expect(edit.y + edit.height <= art.y || edit.x >= art.x + art.width).toBe(true)
  })

  test("a show drawer's runtimes and more links stay on screen", async ({ page }) => {
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Harbor Lights Poster"]') }).tap()

    await expect(page.locator('.episode-description').first()).toBeVisible()
    await expectAcrossScreen(page.locator('.episode-runtime').first())
    await expectAcrossScreen(page.locator('.expand-plot').first())
  })

  test('a show drawer offers more only for a plot that is cut off', async ({ page }) => {
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Harbor Lights Poster"]') }).tap()

    const episode = page.locator('.episode-description').first()
    await expect(episode.locator('.expand-plot')).toBeVisible()
    // Longer than one line, but three phone lines hold it.
    await episode.locator('.plot-truncate').evaluate((plot) => { plot.textContent = 'Finn and Jake follow a map to the edge of the Candy Kingdom and find a door that opens onto the same morning, again and again and again.' })
    await expect(episode.locator('.expand-plot')).toBeHidden()
  })

  test('a show drawer shows a plot of up to three lines whole, and puts more below a longer one', async ({ page }) => {
    await page.goto(SHOWS.path)

    await page.locator(`${SHOWS.tile} a`).filter({ has: page.locator('img[alt="Harbor Lights Poster"]') }).tap()

    const plots = page.locator('.plot-truncate')
    await expect(plots.first()).toBeVisible()
    const long = await plots.first().boundingBox()
    const more = await page.locator('.expand-plot').first().boundingBox()
    expect(more.y).toBeGreaterThanOrEqual(long.y + long.height)
    await page.locator('.expand-plot').first().tap()
    await expect.poll(() => plots.first().evaluate((plot) => plot.scrollHeight <= plot.clientHeight)).toBe(true)
    await page.locator('.expand-plot').first().tap()
    const clipped = await plots.first().evaluate((plot) => {
      plot.textContent = 'x '.repeat(60)
      return plot.scrollHeight > plot.clientHeight || plot.scrollWidth > plot.clientWidth
    })
    expect(clipped).toBe(false)
  })

  for (const grid of [MOVIES, SHOWS]) {
    test(`a long title stays inside its ${grid === MOVIES ? 'movie' : 'show'} tile`, async ({ page }) => {
      await page.goto(grid.path)

      await page.locator(grid.tile).first().locator(grid.title).evaluate((title) => { title.textContent = 'An Extraordinarily Long Title That Never Seems To End' })

      await expectNoSidewaysScroll(page)
      const { width } = await page.locator(grid.tile).first().boundingBox()
      expect(width).toBeLessThanOrEqual((PHONE.viewport.width - 32) / (grid === MOVIES ? 3 : 2))
    })
  }

  test("a home page movie's dialog fits the screen and scrolls inside itself", async ({ page }) => {
    await page.goto('/')

    await page.locator('.top-preview a').first().tap()

    const dialog = page.locator('#movie')
    await expect(dialog.locator('.modal-title')).toBeVisible()
    await expectAcrossScreen(dialog.locator('.modal-content'))
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeInViewport({ ratio: 1 })
    // The tests block Apple's artwork, so the body is given the height it has with a loaded poster at this width.
    await dialog.locator('.modal-body').evaluate((el) => { el.style.minHeight = '1100px' })
    await dialog.hover()
    await page.mouse.wheel(0, 2000)

    await expect(dialog.getByRole('button', { name: 'Close' })).not.toBeInViewport()
    expect(await dialog.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  })

  test('the sign-in dialog fits the screen', async ({ page }) => {
    await page.goto('/')

    await page.locator('#open-sign-in').tap()

    const dialog = page.locator('#logIn')
    for (const field of [dialog.locator('[name="username_email"]'), dialog.locator('[name="password"]'), dialog.locator('#sign-in-submit')]) {
      await expect(field).toBeInViewport({ ratio: 1 })
    }
  })

  test('the home page shows movies two across, then the users', async ({ page }) => {
    await page.goto('/')

    const posters = page.locator('.top-preview')
    const [first, second, third] = [await posters.nth(0).boundingBox(), await posters.nth(1).boundingBox(), await posters.nth(2).boundingBox()]
    expect(second.y).toBe(first.y)
    expect(third.y).toBeGreaterThan(first.y)
    const lastPoster = await posters.last().boundingBox()
    expect((await page.locator('.index-user').first().boundingBox()).y).toBeGreaterThan(lastPoster.y + lastPoster.height)
  })

  test("a person's filmography header fits the screen", async ({ page }) => {
    await page.route('**/movies/search?*', (route) => route.fulfill({ path: new URL('./.generated/credit_search.json', import.meta.url).pathname, contentType: 'application/json' }))
    await page.goto(MOVIES.path)
    await page.getByPlaceholder('Search Collection').pressSequentially('amb')
    await expect(page.locator(MOVIES.tile)).toHaveCount(1)
    await page.locator(`${MOVIES.tile} a`).first().tap()

    await page.getByRole('link', { name: 'Cy Dunn' }).tap()

    await expect(page.locator('#profile-name')).toHaveText('Cy Dunn')
    await expectAcrossScreen(page.locator('#profile-image'))
    await expectAcrossScreen(page.locator('#profile-name'))
    await expectNoSidewaysScroll(page)
  })

  test('the viewport lets visitors zoom', async ({ page }) => {
    await page.goto('/')

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    expect(viewport).not.toMatch(/maximum-scale|user-scalable\s*=\s*no/)
  })
})
