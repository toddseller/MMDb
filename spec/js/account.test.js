// @ts-check
import { test, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, html, stubDialogs } from './dom.js'
import { init } from '#mmdb/account.js'

const LIGHT = '/css/default.css?v=1'
const DARK = '/css/dark.css?v=1'

// layout.erb's theme link, navbar, Sign in button, menu and sign-in dialog.
const PAGE = `
  <link id="theme" rel="stylesheet" href="${LIGHT}" data-default="${LIGHT}" data-dark="${DARK}">
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
    <p class="login-errors">Invalid Password.</p>
    <form class="login-form" action="/users/1" method="post">
      <input type="hidden" name="_method" value="PUT">
      <input type="text" name="first_name" value="Edie">
      <input type="checkbox" name="theme" id="myonoffswitch" value="dark">
      <div id="current"><input type="password" name="current"></div>
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
const logIn = () => /** @type {HTMLDialogElement} */ (page.document.getElementById('logIn'))

const openSettings = async () => {
  answer = () => html(SETTINGS)
  click('#update li')
  await settle()
}

/** @param {string} markup */
const load = (markup) => {
  page = makePage(markup)
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
  answer = () => json({ status: 'true', user_id: 1 })
  type('username_email', 'e2e')
  type('password', 'pw')

  const event = submit('#sign-in-form')
  await settle()

  assert.ok(event.defaultPrevented)
  assert.equal(fetched.calls[0].url, '/sessions')
  assert.equal(fetched.calls[0].init.method, 'POST')
  assert.equal(body(0).toString(), 'username_email=e2e&password=pw')
  assert.deepEqual(replaced, ['/users/1'])
})

test('an empty sign-in shows the error without a request', async () => {
  submit('#sign-in-form')
  await settle()

  assert.equal(fetched.calls.length, 0)
  assert.ok(shown('.login-errors'))
})

test('signing in with Remember me sends it', async () => {
  answer = () => json({ status: 'true', user_id: 1 })
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

  type('password', 'new')
  type('confirm', 'ne')
  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.match(field('confirm').style.border, /rgb\(255, 0, 0\)/)

  type('confirm', 'new')
  assert.ok(!el('#update-submit').hasAttribute('disabled'))
  assert.match(field('confirm').style.border, /rgb\(8, 128, 0\)/)
  assert.ok(shown('#confirm > span'))
})

test('editing the new password after a match holds Update again', async () => {
  await openSettings()
  type('current', 'pw', 'change')
  type('password', 'new')
  type('confirm', 'new')

  type('password', 'newer')

  assert.ok(el('#update-submit').hasAttribute('disabled'))
  assert.match(field('confirm').style.border, /rgb\(255, 0, 0\)/)
})

test('clearing the current password enables Update again', async () => {
  await openSettings()
  type('current', 'pw', 'change')

  type('current', '', 'change')

  assert.ok(!el('#update-submit').hasAttribute('disabled'))
})

test('saving puts the form, writes the new name as text and keeps the shown theme', async () => {
  await openSettings()
  answer = () => json({ status: 'true', name: '<b>Edith</b> Tester', theme: 'dark' })
  el('#myonoffswitch').click()

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
  assert.equal(el('#theme').getAttribute('href'), DARK)
})

test('a refused password resets the password fields and enables Update', async () => {
  await openSettings()
  type('current', 'wrong', 'change')
  type('password', 'new')
  type('confirm', 'new')
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

test('the theme switch swaps the one theme link between versioned URLs', async () => {
  await openSettings()

  el('#myonoffswitch').click()
  assert.equal(el('#theme').getAttribute('href'), DARK)
  el('#myonoffswitch').click()

  assert.equal(el('#theme').getAttribute('href'), LIGHT)
  assert.equal(page.document.querySelectorAll('link').length, 1)
})

test('closing Account Settings without saving puts the saved theme back', async () => {
  await openSettings()
  el('#myonoffswitch').click()

  logIn().close()

  assert.equal(el('#theme').getAttribute('href'), LIGHT)
})

test('registration checks the passwords once typing pauses', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  load(REGISTRATION)
  type('user[password]', 'secret')
  const register = el('input[type=submit]')

  type('confirm', 'sec')
  mock.timers.tick(1000)
  type('confirm', 'secre')
  mock.timers.tick(1000)
  assert.equal(el('#no-match2').textContent, '', 'no check before a 1.5s pause')

  mock.timers.tick(500)
  assert.equal(el('#no-match2').textContent, 'Passwords do not match')
  assert.ok(register.disabled)

  type('confirm', 'secret')
  mock.timers.tick(1500)
  assert.equal(el('#no-match2').style.display, 'none')
  assert.ok(!register.disabled)
  assert.ok(shown('#confirm > span'))
})

test('registration checks again when the password changes after a match', () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  load(REGISTRATION)
  type('user[password]', 'secret')
  type('confirm', 'secret')
  mock.timers.tick(1500)

  type('user[password]', 'secrets')
  mock.timers.tick(1500)

  assert.equal(el('#no-match2').textContent, 'Passwords do not match')
  assert.ok(el('input[type=submit]').disabled)
})
