// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json, stubDialogs } from './dom.js'

test('makePage gives a document with the given markup', () => {
  const { document } = makePage('<p id="hello">Hello</p>')
  assert.equal(document.getElementById('hello')?.textContent, 'Hello')
})

test('stubFetch records requests, answers them, and restores fetch', async () => {
  const original = globalThis.fetch
  const stub = stubFetch(() => json({ ok: true }))

  const response = await fetch('/movies/filter?filter=amb', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })

  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(stub.calls.length, 1)
  assert.equal(stub.calls[0].url, '/movies/filter?filter=amb')
  stub.restore()
  assert.equal(globalThis.fetch, original)
})

test('stubDialogs opens and closes dialogs, firing close once, and reports the animations a test adds', () => {
  const { window, document } = makePage('<dialog id="d"></dialog>')
  const running = stubDialogs(window)
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('d'))
  let closes = 0
  dialog.addEventListener('close', () => closes++)

  dialog.showModal()
  assert.equal(dialog.open, true)
  assert.deepEqual(dialog.getAnimations({ subtree: true }), [])
  const animation = /** @type {Animation} */ (/** @type {unknown} */ ({ finished: Promise.resolve() }))
  running.push(animation)
  assert.deepEqual(dialog.getAnimations({ subtree: true }), [animation])

  dialog.close()
  dialog.close()
  assert.equal(dialog.open, false)
  assert.equal(closes, 1)
})
