// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage } from './dom.js'
import { modal, onModal } from '#mmdb/bootstrap.js'

/** A stand-in for jQuery's $ that records modal calls and keeps the handlers bound through it. */
const stubJQuery = () => {
  const { window, document } = makePage('<div class="modal" id="logIn"></div><div class="modal" id="movie"></div>')
  /** @type {string[]} */
  const calls = []
  /** @type {Array<{ selector: string, type: string, handler: (event: { currentTarget: HTMLElement }) => void }>} */
  const bound = []
  window.$ = /** @type {any} */ ((/** @type {string} */ selector) => ({
    modal: (/** @type {string} */ action) => calls.push(`${selector} ${action}`),
    on: (/** @type {string} */ type, /** @type {any} */ handler) => bound.push({ selector, type, handler }),
  }))
  return { document, calls, bound }
}

test('modal calls Bootstrap on the selector', () => {
  const { document, calls } = stubJQuery()

  modal(document, '#movie', 'show')

  assert.deepEqual(calls, ['#movie show'])
})

test("onModal hands the handler the dialog Bootstrap's event came from", () => {
  const { document, bound } = stubJQuery()
  /** @type {HTMLElement[]} */
  const seen = []

  onModal(document, '.modal', 'shown.bs.modal', (dialog) => seen.push(dialog))
  const dialog = /** @type {HTMLElement} */ (document.getElementById('logIn'))
  bound[0].handler({ currentTarget: dialog })

  assert.equal(bound[0].selector, '.modal')
  assert.equal(bound[0].type, 'shown.bs.modal')
  assert.deepEqual(seen, [dialog])
})
