// @ts-check
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, stubAnimate } from './dom.js'
import { init, search, close } from '#mmdb/preview.js'
import { show, close as closeDrawer, isOpen, openTile } from '#mmdb/drawer.js'

// The add controls and panel as users/show.erb and shows/show.erb render them for the collection's owner.
/** @param {'movies' | 'shows'} kind */
const collection = (kind) => {
  const movies = kind === 'movies'
  return `
  <div id="user-page">
    <div id="search-boxes">
    <input id="search-movie-title" value="amb">
    <button id="${movies ? 'add' : 'add-show'}">Add</button>
    <div id="search" style="display: none">
      <form id="${movies ? 'movie-search' : 'show-search'}"><input id="search-title" name="query"><input type="submit" value="Search"></form>
    </div>
    <div class="preview-wrapper">
      <div class="col-lg-12" id="preview" style="display: none"></div>
      <a id="dismiss" href="#" style="display: none"></a>
      <div id="scroll-left" style="display: none"><span class="glyphicon"></span></div>
      <div id="scroll-right" style="display: none"><span class="glyphicon"></span></div>
    </div>
    </div>
    <div id="panel-room" style="display: none"></div>
    <div id="${movies ? 'movie-list' : 'show-list'}"><div class="index-preview"><p>Amber</p></div></div>
    <footer><div class="footer">30 Movies</div></footer>
  </div>`
}

const movieResult = (title = 'Nova Drift') => `<div class="movie-preview"><form id="create-movie" action="/users/7/movies"><input type="hidden" name="movie[title]" value="${title}"><input type="image" alt="${title} Poster"></form></div>`
const seasonResult = '<div class="show-preview"><form id="create-show" action="/users/7/shows"><input type="hidden" name="show[title]" value="Harbor Lights"><input type="image" alt="Harbor Lights Poster"></form></div>'
const episodeResults = `
  <div class="episode-preview"><form id="create-episode" action="/users/7/shows/1/seasons/1/episodes"><input type="hidden" name="episode[title]" value="Harbor Lights 1x2"><button type="submit" id="episode-video"><span>2</span></button></form></div>
  <div class="episode-preview"><form id="create-episode" action="/users/7/shows/1/seasons/1/episodes"><input type="hidden" name="episodes[][title]" value="Harbor Lights 1x2"><button type="submit" id="1" class="add-all"><span class="glyphicon glyphicon-plus"></span></button></form></div>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched
/** @type {Array<{ resolve: (response: Response) => void }>} */
let pending

/** @param {'movies' | 'shows'} kind */
const load = (kind) => {
  page = makePage(collection(kind))
  init(page.document)
}
/** @param {string} selector */
const el = (selector) => /** @type {HTMLElement} */ (page.document.querySelector(selector))
/** @param {string} selector */
const shown = (selector) => el(selector).style.display !== 'none'
/** @param {string} selector */
const click = (selector) => el(selector).dispatchEvent(new page.window.MouseEvent('click', { bubbles: true, cancelable: true }))
/** @param {string} selector */
const submit = (selector) => {
  const event = new page.window.Event('submit', { bubbles: true, cancelable: true })
  el(selector).dispatchEvent(event)
  return event
}
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
const answerNext = async (/** @type {Response} */ response) => { pending.shift()?.resolve(response); await settle() }
const loadingText = () => el('#preview #loading h3')?.textContent
/** @param {{ scrollWidth: number, clientWidth: number }} sizes */
const size = (sizes) => {
  for (const [name, value] of Object.entries(sizes)) Object.defineProperty(el('#preview'), name, { value, configurable: true })
}

beforeEach(() => {
  pending = []
  fetched = stubFetch(() => new Promise((resolve) => pending.push({ resolve })))
  load('movies')
})

afterEach(() => fetched.restore())

test('Add Movie swaps for the search box', () => {
  click('#add')
  assert.ok(!shown('#add'))
  assert.equal(el('#search').style.display, 'block')
})

test('Add TV Show swaps for the search box', () => {
  load('shows')
  click('#add-show')
  assert.ok(!shown('#add-show'))
  assert.equal(el('#search').style.display, 'block')
})

test('a movie search shows the searching message and dismiss, then the results centred', async () => {
  /** @type {HTMLInputElement} */ (el('#search-title')).value = 'nova'

  const event = submit('#movie-search')

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/movies?query=nova')
  assert.equal(/** @type {HTMLInputElement} */ (el('#search-title')).value, '')
  assert.equal(loadingText(), 'Searching Our Database...')
  assert.equal(el('#preview').style.display, 'flex')
  assert.equal(el('#dismiss').style.display, 'block')
  assert.equal(el('#dismiss').style.top, '0px')

  await answerNext(json({ query: [{}], page: movieResult() }))

  assert.ok(el('#preview input[alt="Nova Drift Poster"]'))
  assert.equal(el('#preview').style.justifyContent, 'center')
})

test('more than six results spread across the panel', async () => {
  submit('#movie-search')
  await answerNext(json({ query: Array(7).fill({}), page: movieResult() }))
  assert.equal(el('#preview').style.justifyContent, 'space-between')
})

test('a show search uses the shows layout', async () => {
  load('shows')
  submit('#show-search')
  assert.equal(fetched.calls[0].url, '/shows?query=')
  assert.equal(el('#preview').style.height, '300px')
  assert.equal(el('#dismiss').style.top, '')
  await answerNext(json({ query: [{}], page: seasonResult }))
  assert.ok(el('#preview input[alt="Harbor Lights Poster"]'))
})

test('a failed movie search shows the placeholder image', async () => {
  submit('#movie-search')
  await answerNext(new Response('error', { status: 500 }))
  assert.ok(el('#preview img[src="/imgs/loading_image.svg"]'))
})

test('a failed show search offers Create New Show', async () => {
  load('shows')
  submit('#show-search')
  await answerNext(new Response('error', { status: 500 }))
  assert.equal(el('#preview #create-new')?.textContent?.trim(), 'Create New Show')
})

test('arrows show only while there is more to scroll that way, and scroll by the panel width', async () => {
  /** @type {Array<ScrollToOptions>} */
  const scrolls = []
  el('#preview').scrollBy = /** @type {any} */ ((/** @type {ScrollToOptions} */ options) => { scrolls.push(options) })
  submit('#movie-search')
  size({ scrollWidth: 2400, clientWidth: 1000 })
  await answerNext(json({ query: Array(12).fill({}), page: movieResult() }))
  assert.ok(shown('#scroll-right'))
  assert.ok(!shown('#scroll-left'))

  click('#scroll-right')
  assert.equal(scrolls[0].left, 1000)

  el('#preview').scrollLeft = 1000
  el('#preview').dispatchEvent(new page.window.Event('scroll'))
  assert.ok(shown('#scroll-left'))
  assert.ok(shown('#scroll-right'))

  el('#preview').scrollLeft = 1400
  el('#preview').dispatchEvent(new page.window.Event('scroll'))
  assert.ok(!shown('#scroll-right'))

  click('#scroll-left')
  assert.equal(scrolls[1].left, -1000)
})

test('results that fit show no arrows', async () => {
  submit('#movie-search')
  size({ scrollWidth: 1000, clientWidth: 1000 })
  await answerNext(json({ query: [{}], page: movieResult() }))
  assert.ok(!shown('#scroll-right'))
  assert.ok(!shown('#scroll-left'))
})

test('adding a movie posts its form with the collection filter, then shows the new collection', async () => {
  submit('#movie-search')
  await answerNext(json({ query: [{}], page: movieResult('Nova <i>Drift</i>') }))

  const event = submit('#create-movie')

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[1].url, '/users/7/movies')
  assert.equal(fetched.calls[1].init.method, 'POST')
  assert.equal(String(fetched.calls[1].init.body), 'movie%5Btitle%5D=Nova+%3Ci%3EDrift%3C%2Fi%3E&filter=amb')
  assert.equal(loadingText(), 'Adding Nova <i>Drift</i> to Your Collection...')
  assert.equal(el('#preview #loading i'), null)

  await answerNext(json({ status: 'true', page: '<div class="index-preview"><p>Nova Drift</p></div>', movie_count: '31' }))

  assert.ok(!shown('#preview'))
  assert.ok(!shown('#dismiss'))
  assert.ok(shown('#add'))
  assert.ok(!shown('#search'))
  assert.equal(el('#movie-list').textContent, 'Nova Drift')
  assert.equal(el('.footer').textContent, '31 Movies')
})

test('picking a season lists its episodes in the episodes layout', async () => {
  load('shows')
  submit('#show-search')
  await answerNext(json({ query: [{}], page: seasonResult }))
  size({ scrollWidth: 2400, clientWidth: 1000 })

  submit('#create-show')
  assert.equal(loadingText(), 'Adding Harbor Lights to Your Collection...')
  await answerNext(json({ status: 'true', page: episodeResults, count: 2 }))

  assert.ok(el('#preview #episode-video'))
  assert.equal(el('#preview').style.justifyContent, 'center')
  assert.equal(el('#scroll-right').style.height, '169px')
  assert.equal(el('#scroll-right').style.top, '84px')
  assert.equal(el('#scroll-right .glyphicon').style.lineHeight, '3.3em')
})

for (const [what, button, title] of [['an episode', '#episode-video', 'Harbor Lights 1x2'], ['a whole season', '.add-all', 'Season 1']]) {
  test(`adding ${what} shows the updated shows and counts`, async () => {
    load('shows')
    submit('#show-search')
    await answerNext(json({ query: [{}], page: seasonResult }))
    submit('#create-show')
    await answerNext(json({ status: 'true', page: episodeResults, count: 2 }))

    const form = /** @type {HTMLFormElement} */ (el(button).closest('form'))
    form.dispatchEvent(new page.window.Event('submit', { bubbles: true, cancelable: true }))
    assert.equal(loadingText(), `Adding ${title} to Your Collection...`)
    await answerNext(json({ status: 'true', page: '<div class="index-preview-show"><p>Harbor Lights</p></div>', show_count: 1, episode_count: 3 }))

    assert.ok(!shown('#preview'))
    assert.ok(shown('#add-show'))
    assert.equal(el('#show-list').textContent, 'Harbor Lights')
    assert.equal(el('.footer').textContent, '1 TV Shows \u2014 3 Episodes')
    assert.equal(fetched.calls.length, 3, 'no details request without a drawer open')
  })
}

// Harbor Lights (show 1) with its drawer open, as a poster click leaves it; Anchor Bay sorts before it once added.
/** @param {string} id @param {string} title */
const showTile = (id, title) => `<div class="index-preview-show" id="7"><a class="show-modal" id="${id}"><img alt="${title} Poster"></a></div>`
const withDrawerOpen = () => {
  load('shows')
  el('#show-list').innerHTML = showTile('1', 'Harbor Lights')
  // jsdom lays nothing out: every element counts as shown, and frames are left to the browser.
  Object.defineProperty(page.window.HTMLElement.prototype, 'offsetParent', { get() { return this.ownerDocument.body }, configurable: true })
  page.window.requestAnimationFrame = () => 0
  closeDrawer(true)
  show(/** @type {HTMLElement} */ (el('.index-preview-show')), '<p>Season 1: one episode</p>')
}
const addAnEpisode = async () => {
  submit('#show-search')
  await answerNext(json({ query: [{}], page: seasonResult }))
  submit('#create-show')
  await answerNext(json({ status: 'true', page: episodeResults, count: 2 }))
  submit('#create-episode')
  await answerNext(json({ status: 'true', page: showTile('2', 'Anchor Bay') + showTile('1', 'Harbor Lights'), show_count: 2, episode_count: 3 }))
}
const drawer = () => el('#show-list > .info')

test('adding episodes with a drawer open fetches the open show’s details before changing the page', async () => {
  withDrawerOpen()
  await addAnEpisode()

  assert.equal(fetched.calls[3].url, '/users/7/shows/1')
  assert.equal(drawer()?.textContent, 'Season 1: one episode')
  assert.equal(el('#show-list').querySelectorAll('.index-preview-show').length, 1, 'the list waits for the details')

  await answerNext(json('<p>Season 1: two episodes</p>'))

  assert.equal(drawer()?.textContent, 'Season 1: two episodes')
  assert.equal(drawer()?.previousElementSibling?.querySelector('a')?.id, '1')
  assert.ok(isOpen())
  assert.equal(el('#show-list').querySelectorAll('.index-preview-show').length, 2)
  assert.equal(el('.footer').textContent, '2 TV Shows \u2014 3 Episodes')
  assert.ok(!shown('#preview'))
})

test('a failed details request still shows the new shows, with the drawer closed', async () => {
  withDrawerOpen()
  await addAnEpisode()

  await answerNext(json('error', 500))

  assert.equal(drawer(), null)
  assert.ok(!isOpen())
  assert.equal(el('#show-list').querySelectorAll('.index-preview-show').length, 2)
  assert.equal(el('.footer').textContent, '2 TV Shows \u2014 3 Episodes')
})

test('a drawer switched to another show while the details load keeps that show’s details', async () => {
  withDrawerOpen()
  await addAnEpisode()
  el('#show-list').insertAdjacentHTML('afterbegin', showTile('2', 'Anchor Bay'))
  show(/** @type {HTMLElement} */ (el('.index-preview-show')), '<p>Anchor Bay</p>')

  await answerNext(json('<p>Season 1: two episodes</p>'))

  assert.equal(drawer()?.textContent, 'Anchor Bay')
  assert.equal(openTile()?.querySelector('a')?.id, '2')
})

test('a drawer closed while the details load stays closed', async () => {
  withDrawerOpen()
  await addAnEpisode()
  closeDrawer(true)

  await answerNext(json('<p>Season 1: two episodes</p>'))

  assert.equal(drawer(), null)
  assert.equal(el('#show-list').querySelectorAll('.index-preview-show').length, 2)
})

test('dismiss closes the panel and its controls and restores the add button', async () => {
  click('#add')
  submit('#movie-search')
  size({ scrollWidth: 2400, clientWidth: 1000 })
  await answerNext(json({ query: Array(12).fill({}), page: movieResult() }))

  click('#dismiss')

  for (const hidden of ['#preview', '#dismiss', '#scroll-left', '#scroll-right', '#search']) assert.ok(!shown(hidden), hidden)
  assert.ok(shown('#add'))
})

test('search and close run the edit form’s search in the panel and close it', async () => {
  search(page.document, '/movies/update?title=amber', 'movies')
  assert.equal(fetched.calls[0].url, '/movies/update?title=amber')
  assert.equal(loadingText(), 'Searching Our Database...')
  await answerNext(json({ query: [{}], page: '<form id="update-movie"></form>' }))
  assert.ok(el('#preview #update-movie'))

  close(page.document)
  assert.ok(!shown('#preview'))
  assert.ok(shown('#add'))
})

test('close works on a visitor’s page, which has no add button', () => {
  el('#add').remove()
  assert.doesNotThrow(() => close(page.document))
  assert.ok(!shown('#preview'))
})

test('an arrow that starts fading out comes back if the panel scrolls back before the fade ends', async () => {
  page.window.matchMedia = /** @type {any} */ (() => ({ matches: false }))
  const fades = stubAnimate(el('#scroll-right'))
  el('#preview').scrollBy = /** @type {any} */ (() => {})
  submit('#movie-search')
  size({ scrollWidth: 2400, clientWidth: 1000 })
  await answerNext(json({ query: Array(12).fill({}), page: movieResult() }))
  /** @param {number} left */
  const scrollTo = (left) => {
    el('#preview').scrollLeft = left
    el('#preview').dispatchEvent(new page.window.Event('scroll'))
  }

  scrollTo(1400)
  scrollTo(800)
  for (const fade of fades) fade.finish()

  assert.ok(shown('#scroll-right'))
})

test('dismissing while a search is still running keeps the panel closed when it answers', async () => {
  submit('#movie-search')
  click('#dismiss')

  await answerNext(json({ query: [{}], page: movieResult() }))

  assert.ok(!shown('#preview'))
  assert.ok(!shown('#dismiss'))
})

test('an earlier search that answers late does not replace a later one', async () => {
  submit('#movie-search')
  submit('#movie-search')

  await answerNext(json({ query: [{}], page: movieResult('Stale') }))
  assert.equal(el('#preview input[alt="Stale Poster"]'), null)
  await answerNext(json({ query: [{}], page: movieResult('Fresh') }))
  assert.ok(el('#preview input[alt="Fresh Poster"]'))
})

// The desktop band: pinned, and 350px taller while the panel shows, with the list pushed down by the room while it shows. jsdom has no
// layout or scrolling, so all of it is given here.
/** @param {{ scrollY?: number, position?: string }} [options] */
const band = ({ scrollY = 0, position = 'fixed' } = {}) => {
  const box = el('#search-boxes')
  box.style.position = position
  Object.defineProperty(box, 'offsetHeight', { get: () => 150 + (el('#preview').style.display === 'flex' ? 350 : 0), configurable: true })
  page.window.matchMedia = /** @type {any} */ (() => ({ matches: false }))
  Object.defineProperty(page.window, 'scrollY', { value: scrollY, writable: true, configurable: true })
  el('#movie-list').getBoundingClientRect = /** @type {any} */ (() => ({ top: el('#panel-room').style.display === 'block' ? 850 : 500 }))
  /** @type {number[]} */
  const scrolls = []
  page.window.scrollBy = /** @type {any} */ ((/** @type {number} */ _x, /** @type {number} */ y) => { scrolls.push(y) })
  return { scrolls, slides: stubAnimate(el('#panel-room')) }
}
const room = () => el('#panel-room')

test('at the top of the page, the room slides open with the panel and nothing scrolls', async () => {
  const { scrolls, slides } = band()

  submit('#movie-search')
  await answerNext(json({ query: [{}], page: movieResult() }))

  assert.equal(room().style.display, 'block')
  assert.equal(room().style.height, '350px')
  assert.equal(slides.length, 1)
  assert.deepEqual(scrolls, [])
})

test('scrolled down, the room opens at once and the page scrolls with it, so the posters stay put', async () => {
  const { scrolls, slides } = band({ scrollY: 800 })

  submit('#movie-search')
  await answerNext(json({ query: [{}], page: movieResult() }))

  assert.equal(room().style.display, 'block')
  assert.equal(room().style.height, '350px')
  assert.equal(slides.length, 0)
  assert.deepEqual(scrolls, [350])
})

test('dismissing scrolled down closes the room at once and scrolls back by the same amount', () => {
  const { scrolls, slides } = band({ scrollY: 800 })
  submit('#movie-search')
  page.window.scrollY = 1150
  scrolls.length = 0

  click('#dismiss')

  assert.equal(room().style.display, 'none')
  assert.equal(slides.length, 0)
  assert.deepEqual(scrolls, [-350])
})

test('dismissing at the top slides the room shut with the panel', () => {
  const { scrolls, slides } = band()
  submit('#movie-search')

  click('#dismiss')

  assert.equal(slides.length, 2)
  slides[1].finish()
  assert.equal(room().style.display, 'none')
  assert.deepEqual(scrolls, [])
})

test('scrolled down where the browser already held the posters still, the page is not scrolled again', async () => {
  const { scrolls } = band({ scrollY: 800 })
  el('#movie-list').getBoundingClientRect = /** @type {any} */ (() => ({ top: 500 }))

  submit('#movie-search')
  await answerNext(json({ query: [{}], page: movieResult() }))

  assert.equal(room().style.display, 'block')
  assert.deepEqual(scrolls, [0])
})

test('a band that scrolls with the page, as on a phone, gets no room and never scrolls the page', () => {
  const { scrolls } = band({ scrollY: 800, position: 'static' })

  submit('#movie-search')
  click('#dismiss')

  assert.equal(room().style.display, 'none')
  assert.deepEqual(scrolls, [])
})
