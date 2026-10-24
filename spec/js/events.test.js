// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage } from './dom.js'
import { on } from '#mmdb/events.js'

/** @param {ReturnType<typeof makePage>} page @param {string} selector */
const click = ({ window, document }, selector) => {
  const element = document.querySelector(selector)
  assert.ok(element, `no element matches ${selector}`)
  element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
}

test('fires for a matching element added after binding, with that element', () => {
  const page = makePage('<div id="user-page"></div>')
  const { document } = page
  /** @type {Element[]} */
  const matched = []
  on(document, 'click', '#four-k', (_event, element) => matched.push(element))

  document.getElementById('user-page')?.insertAdjacentHTML('beforeend', '<a id="four-k" href="/movies/4k/1"><span>4K</span></a>')
  click(page, '#four-k span')

  assert.equal(matched.length, 1)
  assert.equal(matched[0].id, 'four-k')
})

test('does not fire for elements that do not match', () => {
  const page = makePage('<a id="unwatched" href="#">Unwatched</a><a id="four-k" href="#">4K</a>')
  const { document } = page
  let fired = 0
  on(document, 'click', '#four-k', () => { fired += 1 })

  click(page, '#unwatched')

  assert.equal(fired, 0)
})

test('passes the event, so a handler can prevent the default', () => {
  const { window, document } = makePage('<a id="four-k" href="/movies/4k/1">4K</a>')
  on(document, 'click', '#four-k', (event) => event.preventDefault())
  const link = document.getElementById('four-k')
  const event = new window.MouseEvent('click', { bubbles: true, cancelable: true })

  link?.dispatchEvent(event)

  assert.equal(event.defaultPrevented, true)
})
