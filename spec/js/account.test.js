// @ts-check
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, html, stubDialogs } from './dom.js'
import { init } from '#mmdb/account.js'

// layout.erb's navbar, Sign in button, menu and sign-in dialog; load() gives <html> its data-theme.
const PAGE = `
  <p class="navbar-text">Signed in as Edie Tester</p>
  <div id="sign-in"><button type="button" id="open-sign-in">Sign in</button></div>
  <div id="nav-toggle" class="active"></div>
  <div id="drop-down" class="active"><ul>
    <a id="update" href="/users/1/edit"><li>Account Settings</li></a>
    <a id="logout" href="1"><li>Sign Out</li></a>
  </ul></div>
  <dialog class="modal" id="logIn"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-body">
      <p class="login-errors">Invalid login.</p>
      <form id="sign-in-form" action="/sessions" method="POST">
        <input type="text" name="username_email" value="" autofocus="">
        <input type="password" name="password" value="">
        <input id="remember" type="checkbox" name="remember" value="true">
        <button id="sign-in-submit" type="submit">Sign in</button>
      </form>
    </div>
  </div></div></dialog>`

// _edit_user.erb, as Account Settings loads it into #logIn.
const SETTINGS = `
  <div class="modal-body">
    <p class="login-errors">Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.</p>
    <form class="login-form" action="/users/1" method="post">
      <input type="hidden" name="_method" value="PUT">
      <input type="text" name="first_name" value="Edie">
      <input type="radio" name="theme" value="default" checked>
      <input type="radio" name="theme" value="dark">
      <input type="radio" name="theme" value="system">
      <div id="current"><input type="password" name="current"></div>
      <div id="no-match"></div>
      <div class="confirmation"><input type="password" name="password" disabled="disabled"><span></span></div>
      <div id="confirm" class="confirmation"><input type="password" name="confirm" disabled="disabled"><span></span></div>
      <button id="update-submit" type="submit">Update</button>
    </form>
  </div>`

// users/new.erb's password fields.
const REGISTRATION = `
  <div class="container registration"><form class="login-form" action="/users" method="post">
    <div id="no-match2"></div>
    <div class="confirmation"><input type="password" name="user[password]"><span></span></div>
    <div id="confirm" class="confirmation"><input type="password" name="confirm"><span></span></div>
    <input type="submit" disabled="disabled" value="Register">
  </form></div>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {ReturnType<typeof stubFetch>} */
let fetched
/** @type {string[]} */
let replaced
/** @type {(url: string, init: RequestInit) => Response} */
let answer

/** @param {string} selector */
const el = (selector) => /** @type {HTMLInputElement} */ (page.document.querySelector(selector))
/** @param {string} name */
const field = (name) => el(`input[name="${name}"]`)
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
/** @param {string} name @param {string} value @param {'input' | 'change'} [type] */
const type = (name, value, type = 'input') => {
  field(name).value = value
  field(name).dispatchEvent(new page.window.Event(type, { bubbles: true }))
}
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
/** @param {number} n */
const body = (n) => new URLSearchParams(String(fetched.calls[n].init.body))
const shown = (/** @type {string} */ selector) => el(selector).style.display !== 'none' && el(selector).style.display !== ''
/** @param {string} value */
const pick = (value) => el(`input[name="theme"][value="${value}"]`).click()
const pageTheme = () => page.document.documentElement.dataset.theme
const logIn = () => /** @type {HTMLDialogElement} */ (page.document.getElementById('logIn'))

const openSettings = async () => {
  answer = () => html(SETTINGS)
  click('#update li')
  await settle()
}

/** @param {string} markup */
const load = (markup) => {
  page = makePage(markup)
  page.document.documentElement.dataset.theme = 'default'
  replaced = []
  stubDialogs(page.window)
  init(page.document, (url) => replaced.push(url))
}

beforeEach(() => {
  answer = () => json({})
  fetched = stubFetch((url, init) => answer(url, init))
  load(PAGE)
})

afterEach(() => {
  fetched.restore()
  mock.timers.reset()
})

test('signing in posts the filled fields and goes to the collection', async () => {
  answer = () => json({ status: 'true', handle: 'todd-seller' })
  type('username_email', 'e2e')
  type('password', 'pw')

  const event = submit('#sign-in-form')
  await settle()

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/sessions')
  assert.equal(fetched.calls[0].init.method, 'POST')
  assert.equal(body(0).toString(), 'username_email=e2e&password=pw')
  assert.deepEqual(replaced, ['/u/todd-seller'])
})

test('an empty sign-in shows the error without a request', async () => {
  submit('#sign-in-form')
  await settle()

  assert.equal(fetched.calls.length, 0)
  assert.ok(shown('.login-errors'))
})

test('signing in with Remember me sends it', async () => {
  answer = () => json({ status: 'true', handle: 'todd-seller' })
  type('username_email', 'e2e')
  type('password', 'pw')
  field('remember').checked = true

  submit('#sign-in-form')
  await settle()

  assert.equal(body(0).toString(), 'username_email=e2e&password=pw&remember=true')
})

test('a sign-in with only Remember me ticked shows the error without a request', async () => {
  field('remember').checked = true

  submit('#sign-in-form')
  await settle()

  assert.equal(fetched.calls.length, 0)
  assert.ok(shown('.login-errors'))
})

test('a refused sign-in shows the error and empties the form', async () => {
  answer = () => json({ status: 'false' })
  type('username_email', 'e2e')
  type('password', 'wrong')

  submit('#sign-in-form')
  await settle()

  assert.ok(shown('.login-errors'))
  assert.equal(field('username_email').value, '')
  assert.equal(field('password').value, '')
  assert.deepEqual(replaced, [])
})

test('closing the sign-in dialog empties it and hides the error', async () => {
  logIn().showModal()
  submit('#sign-in-form')
  type('username_email', 'e2e')
  field('remember').checked = true

  logIn().close()

  assert.equal(field('username_email').value, '')
  assert.equal(field('remember').checked, false)
  assert.ok(!shown('.login-errors'))
})

test('the Sign in button opens the sign-in dialog', () => {
  click('#open-sign-in')

  assert.equal(logIn().open, true)
})

test('Sign Out posts to the session and goes home', async () => {
  answer = () => html('')

  const event = click('#logout li')
  await settle()

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/sessions/1')
  assert.equal(fetched.calls[0].init.method, 'POST')
  assert.deepEqual(replaced, ['/'])
})

test('Account Settings loads into the dialog, shows it and closes the menu', async () => {
  await openSettings()

  assert.equal(fetched.calls[0].url, '/users/1/edit')
  assert.ok(el('#logIn .login-form'))
  assert.equal(logIn().open, true)
  assert.ok(!el('#drop-down').classList.contains('active'))
  assert.ok(!el('#nav-toggle').classList.contains('active'))
})

test('a current password opens the new fields and holds Update until confirm matches', async () => {
  await openSettings()

  type('current', 'pw', 'change')
  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.ok(!field('password').disabled)
  assert.ok(!field('confirm').disabled)

  type('password', 'new-password')
  type('confirm', 'new-pass')
  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.match(field('confirm').style.border, /rgb\(255, 0, 0\)/)

  type('confirm', 'new-password')
  assert.ok(!el('#update-submit').hasAttribute('disabled'))
  assert.match(field('confirm').style.border, /rgb\(8, 128, 0\)/)
  assert.ok(shown('#confirm > span'))
})

test('editing the new password after a match holds Update again', async () => {
  await openSettings()
  type('current', 'pw', 'change')
  type('password', 'new-password')
  type('confirm', 'new-password')

  type('password', 'newer-password')

  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.match(field('confirm').style.border, /rgb\(255, 0, 0\)/)
})

test('a new password under 8 characters holds Update and says so', async () => {
  await openSettings()
  type('current', 'pw', 'change')

  type('password', 'seven77')
  type('confirm', 'seven77')

  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.equal(el('#no-match').textContent, 'Use at least 8 characters')
  assert.ok(shown('#no-match'))
  assert.ok(!shown('#confirm > span'))
})

test('a long enough mismatch says the passwords differ, and a match hides the message', async () => {
  await openSettings()
  type('current', 'pw', 'change')
  type('password', 'new-password')

  type('confirm', 'new-pass')
  assert.equal(el('#no-match').textContent, 'Passwords do not match')
  assert.ok(shown('#no-match'))

  type('confirm', 'new-password')
  assert.ok(!shown('#no-match'))
})

// The server counts characters, not UTF-16 units, so four emoji are four characters.
test('four emoji are too short, as the server counts them', async () => {
  await openSettings()
  type('current', 'pw', 'change')

  type('password', '😀😀😀😀')
  type('confirm', '😀😀😀😀')

  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.equal(el('#no-match').textContent, 'Use at least 8 characters')
})

test('clearing the current password enables Update again and drops the message', async () => {
  await openSettings()
  type('current', 'pw', 'change')
  type('password', 'short')

  type('current', '', 'change')

  assert.ok(!el('#update-submit').hasAttribute('disabled'))
  assert.ok(!shown('#no-match'))
})

test('saving puts the form, writes the new name as text and keeps the shown theme', async () => {
  await openSettings()
  answer = () => json({ status: 'true', name: '<b>Edith</b> Tester', theme: 'dark' })
  pick('dark')

  const event = submit('#logIn .login-form')
  await settle()

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[1].url, '/users/1')
  assert.equal(fetched.calls[1].init.method, 'PUT')
  assert.equal(body(1).get('first_name'), 'Edie')
  assert.equal(body(1).get('theme'), 'dark')
  assert.ok(!body(1).has('password'), 'disabled fields stay out')
  assert.equal(logIn().open, false)
  assert.equal(el('.navbar-text').textContent, 'Signed in as <b>Edith</b> Tester')
  assert.equal(pageTheme(), 'dark')
})

test('a refused password resets the password fields and enables Update', async () => {
  await openSettings()
  type('current', 'wrong', 'change')
  type('password', 'new-password')
  type('confirm', 'new-password')
  answer = () => json({ status: 'false' })

  submit('#logIn .login-form')
  await settle()

  assert.ok(shown('#logIn .login-errors'))
  assert.equal(field('current').value, '')
  assert.equal(page.document.activeElement, field('current'))
  for (const name of ['password', 'confirm']) {
    assert.equal(field(name).value, '')
    assert.ok(field(name).disabled)
  }
  assert.ok(!shown('#confirm > span'))
  assert.ok(!el('#update-submit').hasAttribute('disabled'))
  assert.equal(logIn().open, true)
})

test('picking a theme shows the page in it at once', async () => {
  await openSettings()

  pick('dark')
  assert.equal(pageTheme(), 'dark')
  pick('system')

  assert.equal(pageTheme(), 'system')
  assert.equal(fetched.calls.length, 1, 'nothing is sent until Update')
})

test('closing Account Settings without saving puts the saved theme back', async () => {
  await openSettings()
  pick('dark')

  logIn().close()

  assert.equal(pageTheme(), 'default')
})

test('registration checks the passwords once typing pauses', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  load(REGISTRATION)
  type('user[password]', 'secret-word')
  const register = el('input[type=submit]')

  type('confirm', 'secret-w')
  mock.timers.tick(1000)
  type('confirm', 'secret-wor')
  mock.timers.tick(1000)
  assert.equal(el('#no-match2').textContent, '', 'no check before a 1.5s pause')

  mock.timers.tick(500)
  assert.equal(el('#no-match2').textContent, 'Passwords do not match')
  assert.ok(register.disabled)

  type('confirm', 'secret-word')
  mock.timers.tick(1500)
  assert.equal(el('#no-match2').style.display, 'none')
  assert.ok(!register.disabled)
  assert.ok(shown('#confirm > span'))
})

test('registration checks again when the password changes after a match', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  load(REGISTRATION)
  type('user[password]', 'secret-word')
  type('confirm', 'secret-word')
  mock.timers.tick(1500)

  type('user[password]', 'secrets-word')
  mock.timers.tick(1500)

  assert.equal(el('#no-match2').textContent, 'Passwords do not match')
  assert.ok(el('input[type=submit]').disabled)
})

test('registration says a password under 8 characters is too short', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  load(REGISTRATION)
  type('user[password]', 'seven77')
  type('confirm', 'seven77')

  mock.timers.tick(1500)

  assert.equal(el('#no-match2').textContent, 'Use at least 8 characters')
  assert.ok(el('input[type=submit]').disabled)
})
