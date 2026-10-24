// @ts-check
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubDialogs } from './dom.js'
import { init, open, close } from '#mmdb/dialog.js'

// A layout dialog with a × button, and the artwork file input, whose own cancel event bubbles.
const PAGE = `<dialog class="modal" id="d"><div class="modal-dialog"><div class="modal-content">
  <button type="button" class="close" data-close>×</button>
  <input type="file" name="artwork">
</div></div></dialog>`

/** @type {ReturnType<typeof makePage>} */
let page
/** @type {Animation[]} */
let running

const dialog = () => /** @type {HTMLDialogElement} */ (page.document.getElementById('d'))
const settle = () => new Promise((resolve) => setTimeout(resolve))

/**
 * An animation on the dialog whose end the test decides: `end()` finishes it, `cancel()` makes its `finished` reject,
 * as a cancel does.
 * @param {string} [pseudoElement]
 */
const animation = (pseudoElement) => {
  /** @type {() => void} */
  let end = () => {}
  /** @type {() => void} */
  let cancel = () => {}
  const finished = new Promise((resolve, reject) => {
    end = () => resolve(undefined)
    cancel = () => reject(new Error('cancelled'))
  })
  running.push(/** @type {Animation} */ (/** @type {unknown} */ ({ finished, effect: { target: dialog(), pseudoElement } })))
  return { end, cancel }
}

/** @param {string} type @param {Element} target */
const fire = (type, target) => {
  const event = new page.window.Event(type, { cancelable: true, bubbles: target !== dialog() })
  target.dispatchEvent(event)
  return event
}

beforeEach(() => {
  page = makePage(PAGE)
  running = stubDialogs(page.window)
  init(page.document)
})

test('open shows the dialog modally', () => {
  open(page.document, 'd')

  assert.equal(dialog().open, true)
})

test('close waits for the fade-out, then closes', async () => {
  open(page.document, 'd')
  const fade = animation()

  const closing = close(page.document, 'd')
  await settle()
  assert.equal(dialog().open, true)
  assert.ok(dialog().classList.contains('closing'))

  fade.end()
  await closing
  assert.equal(dialog().open, false)
  assert.ok(!dialog().classList.contains('closing'))
})

test("the slide on .modal-dialog holds the close too", async () => {
  open(page.document, 'd')
  /** @type {() => void} */
  let end = () => {}
  const finished = new Promise((resolve) => { end = () => resolve(undefined) })
  const box = /** @type {HTMLElement} */ (dialog().querySelector('.modal-dialog'))
  const slide = /** @type {Animation} */ (/** @type {unknown} */ ({ finished, effect: { target: box } }))
  box.getAnimations = () => [slide]

  const closing = close(page.document, 'd')
  await settle()
  assert.equal(dialog().open, true)

  end()
  await closing
  assert.equal(dialog().open, false)
})

test("the backdrop's fade holds the close too", async () => {
  open(page.document, 'd')
  const fade = animation('::backdrop')

  const closing = close(page.document, 'd')
  await settle()
  assert.equal(dialog().open, true)

  fade.end()
  await closing
  assert.equal(dialog().open, false)
})

test("a field's own transition does not hold the close", async () => {
  open(page.document, 'd')
  // A focused field's border transition, or a spinner that never ends.
  const input = /** @type {HTMLElement} */ (dialog().querySelector('input'))
  const forever = /** @type {Animation} */ (/** @type {unknown} */ ({ finished: new Promise(() => {}), effect: { target: input } }))
  input.getAnimations = () => [forever]

  close(page.document, 'd')
  await settle()

  assert.equal(dialog().open, false)
})

test('with nothing animating, close closes at once', async () => {
  open(page.document, 'd')

  await close(page.document, 'd')

  assert.equal(dialog().open, false)
})

test('a cancelled fade still lets the close finish', async () => {
  open(page.document, 'd')
  const fade = animation()

  const closing = close(page.document, 'd')
  fade.cancel()
  await closing

  assert.equal(dialog().open, false)
})

test('opening during the fade-out keeps the dialog open', async () => {
  open(page.document, 'd')
  const fade = animation()
  const closing = close(page.document, 'd')

  open(page.document, 'd')
  fade.end()
  await closing

  assert.equal(dialog().open, true)
  assert.ok(!dialog().classList.contains('closing'))
})

test('Escape is held for the fade-out', async () => {
  open(page.document, 'd')
  const fade = animation()

  const event = fire('cancel', dialog())
  assert.ok(event.defaultPrevented)
  assert.ok(dialog().classList.contains('closing'))

  fade.end()
  await settle()
  assert.equal(dialog().open, false)
})

test("a file picker's cancel is not taken for Escape", () => {
  open(page.document, 'd')

  const event = fire('cancel', /** @type {Element} */ (dialog().querySelector('input[type=file]')))

  assert.ok(!event.defaultPrevented)
  assert.ok(!dialog().classList.contains('closing'))
})

test('a [data-close] button closes its dialog', async () => {
  open(page.document, 'd')
  const button = /** @type {HTMLButtonElement} */ (dialog().querySelector('[data-close]'))

  button.click()
  await settle()

  assert.equal(dialog().open, false)
})

test('a close that skips the fade still clears closing', async () => {
  open(page.document, 'd')
  animation()
  close(page.document, 'd')
  await settle()

  dialog().close()

  assert.ok(!dialog().classList.contains('closing'))
})
