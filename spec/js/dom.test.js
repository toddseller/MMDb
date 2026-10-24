// @ts-check
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makePage, stubFetch, json } from './dom.js'

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
