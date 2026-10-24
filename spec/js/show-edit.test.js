// @ts-check
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json } from './dom.js'
import { init } from '#mmdb/show-edit.js'
import { init as initPreview } from '#mmdb/preview.js'
import { open } from '#mmdb/drawer.js'

const OLD_THUMB = 'https://img.test/old/400x400.jpg'

// The shows page as shows/show.erb renders it for its owner, with the dialog from layout.erb.
const PAGE = `
  <div id="user-page">
    <button id="add-show">Add TV Show</button>
    <div id="search" style="display: none"></div>
    <div class="preview-wrapper">
      <div id="preview" style="display: none"></div>
      <a id="dismiss" href="#" style="display: none"></a>
      <div id="scroll-left" style="display: none"></div>
      <div id="scroll-right" style="display: none"></div>
    </div>
    <div id="show-list"><div class="index-preview-show" id="7"><a class="show-modal" id="3"><img src="${OLD_THUMB}" alt="Tides Poster"></a><p>Tides</p></div></div>
    <footer><div class="footer"></div></footer>
  </div>
  <div class="modal fade" id="edit-show"><div class="modal-dialog"><div class="modal-content"></div></div></div>`

// The drawer's details as _show_info.erb renders them.
const DETAILS = `
  <div id="meta-data"><div class="modal-body"><div id="info-header">
    <a class="show-edit" href="/users/7/shows/3/edit"></a>
    <div class="description-poster"><img src="https://img.test/old/600x600.jpg" alt="Tides Poster"></div>
    <form id="season-default" action="/users/7/shows/3/seasons/" method="POST">
      <input class="season-submit" id="active-season" type="submit" name="season[:id]" value="1">
      <input class="season-submit" type="submit" name="season[:id]" value="2">
    </form>
  </div></div></div>`

// The edit dialog as _edit_show.erb renders it, one field per tab form.
/** @param {{ next?: string, previous?: string }} [arrows] */
const EDIT = ({ next = '/users/7/shows/3/seasons/5/episodes/12/edit', previous } = {}) => `
  <div class="modal-header"><div class="edit-poster"><img src="https://img.test/old/600x600.jpg"></div><h4>Tides &amp; Co</h4><p>Season 1, 3 episodes selected</p></div>
  <div class="modal-body">
    <div class="btn-group" role="group">
      <button type="button" class="btn btn-default active" data-toggle="tab" href="#detail">Details</button>
      <button type="button" class="btn btn-default" data-toggle="tab" href="#artwork">Artwork</button>
    </div>
    <div class="edit-container tab-content">
      <div id="detail" class="tab-pane in active">
        <form class="form-horizontal show-data" id="11" action="/users/7/shows/3" method="POST"><textarea name="episode[title]">Tides 1x1</textarea></form>
        <button id="episode-delete" class="btn btn-danger" href="/users/7/shows/3/seasons/5/episodes/11">Delete Episode</button>
      </div>
      <div id="artwork" class="tab-pane">
        <form class="form-horizontal show-data" action="/users/7/shows/3" method="POST">
          <img src="https://img.test/old/600x600.jpg">
          <input type="text" name="season[poster]" value="https://img.test/old/600x600.jpg">
          <input type="file" id="artwork-file" name="artwork" data-upload="/users/7/shows/3/artwork">
          <p class="artwork-message help-block"></p>
        </form>
      </div>
      <div id="sorting" class="tab-pane">
        <form class="form-horizontal show-data" action="/users/7/shows/3" method="POST"><textarea name="show[title]">Tides &amp; Co</textarea></form>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    ${previous ? `<button type="button" class="btn btn-default edit-next" href="${previous}"></button>` : '<button type="button" class="btn btn-default disabled edit-next" disabled="disabled"></button>'}
    ${next ? `<button type="button" class="btn btn-default edit-next" href="${next}"></button>` : '<button type="button" class="btn btn-default disabled edit-next" disabled="disabled"></button>'}
    <p class="edit-error text-danger" role="alert" hidden></p>
    <button id="cancel" class="btn btn-default">Cancel</button>
    <button id="ok" class="btn btn-danger">OK</button>
  </div>`

// Create New Show as _create_show.erb renders it, with _new_episode.erb in the Episode tab.
const EPISODE_FORM = `<form class="form-horizontal show-data new-show" action="/shows" method="POST"><textarea name="episode[title]"></textarea></form>
  <button id="add-new-episode" class="btn btn-default"></button>`
const CREATE = `
  <div class="modal-header"><div class="edit-poster"><img src=""></div><h4></h4><p></p></div>
  <div class="modal-body"><div class="edit-container tab-content">
    <div id="show" class="tab-pane in active"><form class="form-horizontal show-data new-show" action="/shows" method="POST"><textarea name="show[title]"></textarea><input type="text" name="season[poster]"></form></div>
    <div id="season" class="tab-pane"><form class="form-horizontal show-data new-show" action="/shows" method="POST"><input type="text" name="season[season]"></form></div>
    <div id="episode" class="tab-pane">${EPISODE_FORM}</div>
  </div></div>
  <div class="modal-footer">
    <p class="edit-error text-danger" role="alert" hidden></p>
    <button id="cancel" class="btn btn-default">Cancel</button>
    <button id="ok" class="btn btn-danger">OK</button>
  </div>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched
/** @type {Array<{ resolve: (response: Response) => void }>} */
let pending
/** @type {string[]} */
let modal

/** @param {string} selector */
const el = (selector) => /** @type {HTMLElement} */ (page.document.querySelector(selector))
/** @param {string} selector */
const click = (selector) => {
  const event = new page.window.MouseEvent('click', { bubbles: true, cancelable: true })
  el(selector).dispatchEvent(event)
  return event
}
/** @param {string} selector @param {string} value */
const fill = (selector, value) => { /** @type {HTMLInputElement} */ (el(selector)).value = value }
/** @param {string} selector */
const change = (selector) => el(selector).dispatchEvent(new page.window.Event('change', { bubbles: true }))
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
const answerNext = async (/** @type {Response} */ response) => { pending.shift()?.resolve(response); await settle() }
/** @param {number} n */
const body = (n) => new URLSearchParams(String(fetched.calls[n].init.body))
const error = () => el('#edit-show .edit-error')
const tileImage = () => el('#show-list img')
const failed = (status = 500, text = '') => new Response(text, { status })

const openDialog = async (html = EDIT()) => {
  click('.show-edit')
  await answerNext(json(html))
}

beforeEach(() => {
  pending = []
  modal = []
  fetched = stubFetch(() => new Promise((resolve) => pending.push({ resolve })))
  page = makePage(PAGE)
  page.window.$ = /** @type {any} */ ((/** @type {string} */ selector) => ({ modal: (/** @type {string} */ action) => modal.push(`${selector} ${action}`) }))
  init(page.document)
  initPreview(page.document)
  open(/** @type {HTMLElement} */ (el('#show-list .index-preview-show')), DETAILS, true)
})

afterEach(() => fetched.restore())

test('the edit link opens the dialog with the form the server renders', async () => {
  const event = click('.show-edit')

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/users/7/shows/3/edit')
  await answerNext(json(EDIT()))
  assert.equal(el('#edit-show textarea[name="episode[title]"]').textContent, 'Tides 1x1')
  assert.deepEqual(modal, ['#edit-show show'])
})

test('a tab click moves the highlight and sends nothing', async () => {
  await openDialog()

  click('#edit-show [href="#artwork"]')

  assert.equal(fetched.calls.length, 1)
  assert.ok(el('#edit-show [href="#artwork"]').classList.contains('active'))
  assert.ok(!el('#edit-show [href="#detail"]').classList.contains('active'))
})

test('OK saves every tab, then shows the details and the tile thumbnail and closes', async () => {
  await openDialog()
  fill('#edit-show textarea[name="episode[title]"]', 'Renamed')
  fill('#edit-show input[name="season[poster]"]', 'https://img.test/new/600x600.jpg')

  click('#edit-show #ok')
  assert.equal(fetched.calls[1].url, '/users/7/shows/3')
  assert.equal(fetched.calls[1].init.method, 'PUT')
  assert.deepEqual([...body(1)], [
    ['episode[title]', 'Renamed'], ['season[poster]', 'https://img.test/new/600x600.jpg'], ['show[title]', 'Tides & Co'],
    ['show[poster]', 'https://img.test/new/600x600.jpg'], ['form[id]', '11'],
  ])
  assert.deepEqual(modal, ['#edit-show show'])
  await answerNext(json({ page: '<p class="saved">Saved</p>', poster: 'https://img.test/new/400x400.jpg' }))

  assert.equal(el('.info .info-wrapper').innerHTML, '<p class="saved">Saved</p>')
  assert.equal(tileImage().getAttribute('src'), 'https://img.test/new/400x400.jpg')
  assert.deepEqual(modal, ['#edit-show show', '#edit-show hide'])
})

test('a failed save names the stored title as text, keeps the dialog and hides the line on the next try', async () => {
  await openDialog()
  fill('#edit-show textarea[name="show[title]"]', 'Typed <b>title</b>')

  click('#edit-show #ok')
  await answerNext(failed())

  assert.equal(error().hidden, false)
  assert.equal(error().textContent, "Couldn't save Tides & Co. Try again.")
  assert.deepEqual(modal, ['#edit-show show'])
  assert.equal(tileImage().getAttribute('src'), OLD_THUMB)
  click('#edit-show #ok')
  assert.equal(error().hidden, true)
})

test('Cancel closes without a request', async () => {
  await openDialog()

  click('#edit-show #cancel')

  assert.equal(fetched.calls.length, 1)
  assert.deepEqual(modal, ['#edit-show show', '#edit-show hide'])
})

test('an arrow saves first, then shows the other episode in the open dialog', async () => {
  await openDialog()

  click('#edit-show .edit-next[href]')
  assert.equal(fetched.calls.length, 2)
  assert.equal(fetched.calls[1].init.method, 'PUT')
  await answerNext(json({ page: '<p>Saved</p>', poster: OLD_THUMB }))

  assert.equal(fetched.calls[2].url, '/users/7/shows/3/seasons/5/episodes/12/edit')
  await answerNext(json(EDIT({ previous: '/users/7/shows/3/seasons/5/episodes/11/edit' }).replace('Tides 1x1', 'Tides 1x2')))
  assert.equal(el('#edit-show textarea[name="episode[title]"]').textContent, 'Tides 1x2')
  assert.equal(el('.info .info-wrapper').innerHTML, '<p>Saved</p>')
  assert.deepEqual(modal, ['#edit-show show'])
})

test('an arrow whose save fails stays on the episode and says so', async () => {
  await openDialog()

  click('#edit-show .edit-next[href]')
  await answerNext(failed())

  assert.equal(fetched.calls.length, 2)
  assert.equal(error().textContent, "Couldn't save Tides & Co. Try again.")
  assert.equal(el('#edit-show textarea[name="episode[title]"]').textContent, 'Tides 1x1')
})

test('an arrow whose save works but whose next episode fails to load reports no failed save', async () => {
  await openDialog()

  click('#edit-show .edit-next[href]')
  await answerNext(json({ page: '<p>Saved</p>', poster: OLD_THUMB }))
  await answerNext(failed())

  assert.equal(error().hidden, true)
  assert.equal(el('#edit-show textarea[name="episode[title]"]').textContent, 'Tides 1x1')
})

test('Delete Episode shows the next episode and the counts as text', async () => {
  await openDialog()

  click('#edit-show #episode-delete')
  assert.equal(fetched.calls[1].url, '/users/7/shows/3/seasons/5/episodes/11')
  assert.equal(fetched.calls[1].init.method, 'DELETE')
  await answerNext(json({ page: EDIT().replace('Tides 1x1', 'Tides 1x2'), show_count: '2', episode_count: '<b>5</b>' }))

  assert.equal(el('#edit-show textarea[name="episode[title]"]').textContent, 'Tides 1x2')
  assert.equal(el('.footer').textContent, '2 TV Shows \u2014 <b>5</b> Episodes')
})

test('a failed delete names the stored episode title and keeps the episode', async () => {
  await openDialog()
  fill('#edit-show textarea[name="episode[title]"]', 'Typed')

  click('#edit-show #episode-delete')
  await answerNext(failed())

  assert.equal(error().textContent, "Couldn't delete Tides 1x1. Try again.")
  assert.equal(/** @type {HTMLTextAreaElement} */ (el('#edit-show textarea[name="episode[title]"]')).value, 'Typed')
})

test('a poster change previews in the dialog only', async () => {
  await openDialog()
  fill('#edit-show input[name="season[poster]"]', 'https://img.test/new/600x600.jpg')

  change('#edit-show input[name="season[poster]"]')

  assert.equal(el('#edit-show .edit-poster img').getAttribute('src'), 'https://img.test/new/600x600.jpg')
  assert.equal(el('#edit-show #artwork img').getAttribute('src'), 'https://img.test/new/600x600.jpg')
  assert.equal(el('.info .description-poster img').getAttribute('src'), 'https://img.test/old/600x600.jpg')
  assert.equal(tileImage().getAttribute('src'), OLD_THUMB)
})

/** @param {HTMLInputElement} input */
const pickFile = (input) => {
  const file = new page.window.File(['jpeg'], 'poster.jpg', { type: 'image/jpeg' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  Object.defineProperty(input, 'value', { value: 'C:\\fakepath\\poster.jpg', writable: true, configurable: true })
  input.dispatchEvent(new page.window.Event('change', { bubbles: true }))
  return file
}

test('an upload posts the file, then fills the poster field and previews it', async () => {
  await openDialog()
  const input = /** @type {HTMLInputElement} */ (el('#artwork-file'))

  const file = pickFile(input)
  assert.equal(el('.artwork-message').textContent, 'Uploading...')
  assert.equal(fetched.calls[1].url, '/users/7/shows/3/artwork')
  assert.equal(fetched.calls[1].init.method, 'POST')
  assert.equal(/** @type {FormData} */ (fetched.calls[1].init.body).get('artwork'), file)
  await answerNext(json({ url: 'https://cdn.test/up.jpg' }))

  assert.equal(el('.artwork-message').textContent, '')
  assert.equal(/** @type {HTMLInputElement} */ (el('#edit-show input[name="season[poster]"]')).value, 'https://cdn.test/up.jpg')
  assert.equal(el('#edit-show .edit-poster img').getAttribute('src'), 'https://cdn.test/up.jpg')
  assert.equal(input.value, '')
})

for (const [answer, message] of /** @type {const} */ ([
  [JSON.stringify({ error: 'Only JPEG and PNG.' }), 'Only JPEG and PNG.'],
  ['<html>Bad Gateway</html>', "The artwork couldn't be uploaded. Try again."],
])) {
  test(`a failed upload shows "${message}" and keeps the field`, async () => {
    await openDialog()
    const input = /** @type {HTMLInputElement} */ (el('#artwork-file'))

    pickFile(input)
    await answerNext(failed(422, answer))

    assert.equal(el('.artwork-message').textContent, message)
    assert.equal(/** @type {HTMLInputElement} */ (el('#edit-show input[name="season[poster]"]')).value, 'https://img.test/old/600x600.jpg')
    assert.equal(input.value, '')
  })
}

test('a season button sets the default season and puts its thumbnail on the tile', async () => {
  const event = click('.season-submit:not(#active-season)')

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/users/7/shows/3/seasons/2')
  assert.equal(fetched.calls[0].init.method, 'POST')
  await answerNext(json({ page: '<p>Season 2</p>', poster: 'https://img.test/s2/400x400.jpg' }))

  assert.equal(el('.info .info-wrapper').innerHTML, '<p>Season 2</p>')
  assert.equal(tileImage().getAttribute('src'), 'https://img.test/s2/400x400.jpg')
})

const openCreate = async () => {
  page.document.getElementById('user-page')?.insertAdjacentHTML('beforeend', '<button type="button" id="create-new" class="add-all"></button>')
  el('#preview').style.display = 'flex'
  click('#create-new')
  await answerNext(json({ page: CREATE }))
}

test('Create New Show closes the search panel and opens the form for the signed-in user', async () => {
  await openCreate()

  assert.equal(fetched.calls[0].url, '/shows/new')
  assert.equal(el('#preview').style.display, 'none')
  assert.ok(el('#edit-show #add-new-episode'))
  assert.deepEqual(modal, ['#edit-show show'])
})

/** @param {string} count */
const added = (count) => json({ page: '<div class="index-preview-show"><p>Handmade</p></div>', form: EPISODE_FORM, season: '1', count })

for (const [count, line] of /** @type {const} */ ([['1', 'Season 1, 1 episode added'], ['2', 'Season 1, 2 episodes added']])) {
  test(`"+" adds the episode and reports "${line}"`, async () => {
    await openCreate()
    fill('#edit-show textarea[name="show[title]"]', 'Handmade')
    fill('#edit-show textarea[name="episode[title]"]', 'Handmade 1x1')

    click('#edit-show #add-new-episode')
    assert.equal(fetched.calls[1].url, '/shows')
    assert.equal(fetched.calls[1].init.method, 'POST')
    assert.equal(body(1).get('new'), 'true')
    assert.equal(body(1).get('episode[title]'), 'Handmade 1x1')
    await answerNext(added(count))

    assert.equal(/** @type {HTMLTextAreaElement} */ (el('#edit-show textarea[name="episode[title]"]')).value, '')
    assert.equal(el('#show-list').textContent, 'Handmade')
    assert.equal(el('#edit-show .modal-header p').textContent, line)
    assert.deepEqual(modal, ['#edit-show show'])
  })
}

test('OK in Create New Show adds a titled episode, then closes', async () => {
  await openCreate()
  fill('#edit-show textarea[name="episode[title]"]', 'Handmade 1x2')

  click('#edit-show #ok')
  assert.equal(body(1).get('new'), 'true')
  await answerNext(added('2'))

  assert.equal(el('#show-list').textContent, 'Handmade')
  assert.deepEqual(modal, ['#edit-show show', '#edit-show hide'])
})

test('OK in Create New Show with no episode title just closes', async () => {
  await openCreate()
  fill('#edit-show textarea[name="episode[title]"]', '  ')

  click('#edit-show #ok')

  assert.equal(fetched.calls.length, 1)
  assert.deepEqual(modal, ['#edit-show show', '#edit-show hide'])
})

test('a failed add in Create New Show names the typed show title', async () => {
  await openCreate()
  fill('#edit-show textarea[name="show[title]"]', 'Handmade')
  fill('#edit-show textarea[name="episode[title]"]', 'Handmade 1x1')

  click('#edit-show #ok')
  await answerNext(failed())

  assert.equal(error().textContent, "Couldn't save Handmade. Try again.")
  assert.deepEqual(modal, ['#edit-show show'])
})
