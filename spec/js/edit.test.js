// @ts-check
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, html } from './dom.js'
import { init } from '#mmdb/edit.js'
import { init as initPreview } from '#mmdb/preview.js'
import { init as initDrawer, open, close, isOpen, openTile } from '#mmdb/drawer.js'
import { rememberQuery } from '#mmdb/filters.js'

// The tile id is the user's and the poster link's id is the movie's, as _filtered_list.erb renders them.
/** @param {Array<[number, string]>} movies */
const tiles = (movies) => movies.map(([id, title]) =>
  `<div class="index-preview" id="7"><a class="movie-modal" id="${id}"><img alt="${title} Poster"></a><p>${title}</p></div>`).join('')

// The collection page as users/show.erb renders it for its owner, with the sign-in/profile modal from layout.erb.
const PAGE = `
  <div id="user-page">
    <form id="filter-input"><input id="search-movie-title" type="text"></form>
    <button id="add">Add Movie</button>
    <div id="search" style="display: none"></div>
    <div class="preview-wrapper">
      <div id="preview" style="display: none"></div>
      <a id="dismiss" href="#" style="display: none"></a>
      <div id="scroll-left" style="display: none"></div>
      <div id="scroll-right" style="display: none"></div>
    </div>
    <div id="movie-list">${tiles([[12, 'Amber'], [7, 'Birch']])}</div>
    <footer><div class="footer">2 Movies</div></footer>
  </div>
  <div class="modal" id="logIn"><div class="modal-content"><div class="modal-body">Sign in!</div></div></div>`

// The details as _info.erb renders them, with the stars from _ratings_form.erb.
const DETAILS = `
  <div id="meta-data">
    <div class="modal-header"><a class="movie-edit" href="/users/7/movies/12/edit"></a></div>
    <div class="modal-body">
      <div id="ratings-container"><form action="/movies/12/ratings" method="post" class="rating">
        <input type="radio" id="star5" class="rating-input" name="rating" value="5"><label for="star5">5 stars</label>
        <input type="radio" id="star4" class="rating-input" name="rating" value="4"><label for="star4">4 stars</label>
      </form></div>
      <p class="description-plot">Amber is a seeded movie.</p>
    </div>
  </div>`

// The form as _edit_movie.erb renders it.
const FORM = `
  <div class="modal-body"><form class="form-horizontal edit-form" action="/users/7/movies/12" method="POST">
    <input type="hidden" name="_method" value="PUT">
    <textarea id="movie_title" name="movie[title]">Amber &amp; Co</textarea>
    <textarea name="movie[plot]">Amber is a seeded movie.</textarea>
    <div class="checkbox hd form-check"><input type="hidden" name="movie[hd]" value="0"></div>
    <div class="checkbox hd form-check"><input type="checkbox" name="movie[hd]" value="4"></div>
    <div class="checkbox hd form-check"><input type="checkbox" name="movie[hd]" value="1080" checked="checked"></div>
    <div class="checkbox hd form-check"><input type="checkbox" name="movie[hd]" value="720"></div>
    <button id="edit-button" type="submit">Update</button>
  </form>
  <form id="delete-form" action="/users/7/movies/12" method="POST"><input type="hidden" name="_method" value="DELETE"><button id="delete-button" type="submit">Delete</button></form>
  <button id="update-search">Search</button>
  <p class="edit-error text-danger" role="alert" hidden></p></div>`

const RESULT = `<div class="movie-preview"><form id="update-movie" action="/movies/update/12" method="POST">
  <input type="hidden" name="_method" value="PUT"><input type="hidden" name="movie[title]" value="Nova Drift"><input type="image" alt="Nova Drift Poster"></form></div>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched
/** @type {Array<{ resolve: (response: Response) => void }>} */
let pending

/** @param {string} selector */
const el = (selector) => /** @type {HTMLElement} */ (page.document.querySelector(selector))
/** @param {string} selector */
const click = (selector) => {
  const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true })
  el(selector).dispatchEvent(event)
  return event
}
/** @param {string} selector */
const submit = (selector) => {
  const event = new page.window.Event('submit', { bubbles: true, cancelable: true })
  el(selector).dispatchEvent(event)
  return event
}
/** @param {string} selector @param {string} value */
const fill = (selector, value) => { /** @type {HTMLInputElement} */ (el(selector)).value = value }
/** @param {HTMLInputElement} input */
const change = (input) => input.dispatchEvent(new page.window.Event('change', { bubbles: true }))
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
const answerNext = async (/** @type {Response} */ response) => { pending.shift()?.resolve(response); await settle() }
/** @param {number} n */
const body = (n) => new URLSearchParams(/** @type {string} */ (String(fetched.calls[n].init.body)))
const titles = () => [...page.document.querySelectorAll('#movie-list .index-preview p')].map((p) => p.textContent)
const tileOf = (/** @type {string} */ title) => /** @type {HTMLElement} */ ([...page.document.querySelectorAll('#movie-list .index-preview')].find((tile) => tile.textContent === title))
const error = () => el('.info .edit-error')

const openForm = async () => {
  click('.movie-edit')
  await answerNext(json(FORM))
}

beforeEach(() => {
  pending = []
  fetched = stubFetch(() => new Promise((resolve) => pending.push({ resolve })))
  page = makePage(PAGE)
  rememberQuery('')
  init(page.document)
  initPreview(page.document)
  initDrawer(page.document)
  open(tileOf('Amber'), DETAILS, true)
})

afterEach(() => fetched.restore())

test('the edit link puts the form in the drawer only and closes the search panel', async () => {
  el('#preview').style.display = 'flex'

  const event = click('.movie-edit')
  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/users/7/movies/12/edit')
  await answerNext(json(FORM))

  assert.ok(el('.info .edit-form'))
  assert.equal(page.document.querySelectorAll('.edit-form').length, 1)
  assert.equal(el('#logIn .modal-body').textContent, 'Sign in!')
  assert.equal(el('#preview').style.display, 'none')
})

for (const [how, act] of /** @type {const} */ ([['Update', () => click('#edit-button')], ['Enter in a field', () => submit('.info .edit-form')]])) {
  test(`${how} saves with the list query, redraws the grid and reopens the drawer on the movie`, async () => {
    await openForm()
    rememberQuery('amb')
    fill('#search-movie-title', 'amb')
    fill('.info textarea[name="movie[plot]"]', 'A new plot.')

    act()
    assert.equal(fetched.calls[1].url, '/users/7/movies/12')
    assert.equal(fetched.calls[1].init.method, 'PUT')
    assert.equal(body(1).get('movie[plot]'), 'A new plot.')
    assert.equal(body(1).get('filter'), 'amb')
    // Movie 7's tile also has the user's id, 7, so a lookup by id alone would find Amber's tile first.
    await answerNext(json({ page: '<p class="description-plot">A new plot.</p>', query: tiles([[12, 'Amber'], [7, 'Birch']]), id: 7 }))

    assert.ok(isOpen())
    assert.equal(openTile(), tileOf('Birch'))
    assert.equal(el('.info .description-plot').textContent, 'A new plot.')
    assert.ok(el('.info').classList.contains('open'))
    assert.equal(page.document.querySelectorAll('.info').length, 1)
  })
}

test('a save that moves the movie out of the list shown closes the drawer without reporting a failure', async () => {
  await openForm()
  const line = error()

  click('#edit-button')
  await answerNext(json({ page: '<p>Details</p>', query: tiles([[7, 'Birch']]), id: 12 }))

  assert.ok(!isOpen())
  assert.deepEqual(titles(), ['Birch'])
  assert.equal(line.hidden, true)
})

test('Delete keeps the drawer open until the server confirms, then redraws the grid and count', async () => {
  await openForm()
  rememberQuery('Ann Lee')

  const event = submit('#delete-form')
  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[1].url, '/users/7/movies/12')
  assert.equal(fetched.calls[1].init.method, 'DELETE')
  assert.equal(body(1).get('name'), 'Ann Lee')
  assert.ok(isOpen())
  await answerNext(json({ status: 'true', page: tiles([[7, 'Birch']]), movie_count: '1' }))

  assert.ok(!isOpen())
  assert.deepEqual(titles(), ['Birch'])
  assert.equal(el('.footer').textContent, '1 Movies')
  assert.equal(el('.footer').style.display, '')
})

for (const [action, act, verb] of /** @type {const} */ ([['save', () => click('#edit-button'), 'save'], ['delete', () => click('#delete-button'), 'delete']])) {
  test(`a failed ${action} names the stored title as text and leaves the drawer and grid alone`, async () => {
    await openForm()
    fill('.info textarea[name="movie[title]"]', 'Typed <b>title</b>')

    act()
    await answerNext(json({}, 500))

    assert.equal(error().hidden, false)
    assert.equal(error().textContent, `Couldn't ${verb} Amber & Co. Try again.`)
    assert.equal(error().children.length, 0)
    assert.ok(isOpen())
    assert.ok(el('.info .edit-form'))
    assert.deepEqual(titles(), ['Amber', 'Birch'])

    act()
    assert.equal(error().hidden, true)
  })
}

test('a delete the server doesn’t confirm counts as failed', async () => {
  await openForm()
  click('#delete-button')
  await answerNext(json({ status: 'false' }))

  assert.equal(error().hidden, false)
  assert.ok(isOpen())
})

test('Search looks up the stored title, not the typed one, in the search panel', async () => {
  await openForm()
  fill('.info textarea[name="movie[title]"]', 'Something typed')

  click('#update-search')

  assert.equal(fetched.calls[1].url, `/movies/update?${new URLSearchParams({ title: 'Amber & Co', route: '/users/7/movies/12' })}`)
  assert.equal(el('#preview #loading h3').textContent, 'Searching Our Database...')
})

test('picking a result saves it, closes the panel and shows the returned form', async () => {
  await openForm()
  click('#update-search')
  await answerNext(json({ query: [{}], page: RESULT }))

  const event = submit('#update-movie')
  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[2].url, '/movies/update/12')
  assert.equal(fetched.calls[2].init.method, 'PUT')
  assert.equal(body(2).get('movie[title]'), 'Nova Drift')
  await answerNext(json(FORM.replace('Amber &amp; Co', 'Nova Drift')))

  assert.equal(el('#preview').style.display, 'none')
  assert.equal(/** @type {HTMLTextAreaElement} */ (el('.info textarea[name="movie[title]"]')).value, 'Nova Drift')
  assert.equal(page.document.querySelectorAll('.info .modal-body').length, 1)
})

test('a failed pick keeps the panel open and says so in the form', async () => {
  await openForm()
  click('#update-search')
  await answerNext(json({ query: [{}], page: RESULT }))

  submit('#update-movie')
  await answerNext(json({}, 500))

  assert.notEqual(el('#preview').style.display, 'none')
  assert.equal(error().textContent, "Couldn't save Amber & Co. Try again.")
})

test('a result picked after the drawer moved to another movie is saved without touching that movie', async () => {
  await openForm()
  click('#update-search')
  await answerNext(json({ query: [{}], page: RESULT }))
  close(true)
  open(tileOf('Birch'), '<div id="meta-data"><div class="modal-body">Birch details</div></div>', true)

  submit('#update-movie')
  assert.equal(fetched.calls[2]?.url, '/movies/update/12')
  await answerNext(json(FORM))

  assert.equal(el('#preview').style.display, 'none')
  assert.equal(el('.info .modal-body').textContent, 'Birch details')
})

test('checking one video quality unchecks the others', async () => {
  await openForm()
  /** @param {string} value */
  const quality = (value) => /** @type {HTMLInputElement} */ (el(`.info input[type=checkbox][value="${value}"]`))

  quality('4').checked = true
  change(quality('4'))

  assert.deepEqual(['4', '1080', '720'].map((value) => quality(value).checked), [true, false, false])
})

test('choosing a star saves the rating and shows the saved stars', async () => {
  const star = /** @type {HTMLInputElement} */ (el('#star4'))
  star.checked = true
  change(star)

  assert.equal(fetched.calls[0].url, '/movies/12/ratings')
  assert.equal(fetched.calls[0].init.method, 'POST')
  assert.equal(body(0).get('rating'), '4')
  assert.equal(page.document.querySelector('.rating label[style]'), null)
  await answerNext(html('<form class="rating"><input type="radio" id="star4" checked></form><p>Based on 1 User Rating</p>'))

  assert.equal(el('#ratings-container p').textContent, 'Based on 1 User Rating')
})
