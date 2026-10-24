// @ts-check
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { stubFetch, json, html } from './dom.js'
import { request } from '#mmdb/request.js'

/** @type {{ restore: () => void } | undefined} */
let stub
afterEach(() => stub?.restore())

test('marks the request as AJAX, as the routes check with request.xhr?, and sends cookies', async () => {
  const fetched = stubFetch(() => json({}))
  stub = fetched

  await request('/movies/filter?filter=amb')

  const headers = new Headers(fetched.calls[0].init.headers)
  assert.equal(headers.get('X-Requested-With'), 'XMLHttpRequest')
  assert.equal(fetched.calls[0].init.credentials, 'same-origin')
})

test('passes the method and body through', async () => {
  const fetched = stubFetch(() => json({}))
  stub = fetched

  await request('/sessions', { method: 'POST', body: new URLSearchParams({ a: '1' }) })

  assert.equal(fetched.calls[0].init.method, 'POST')
  assert.equal(String(fetched.calls[0].init.body), 'a=1')
})

test('returns parsed JSON for a JSON response', async () => {
  stub = stubFetch(() => json({ page: '<div></div>', count: 1 }))

  assert.deepEqual(await request('/movies/filter'), { page: '<div></div>', count: 1 })
})

test('returns text for any other response', async () => {
  stub = stubFetch(() => html('<div class="index-preview"></div>'))

  assert.equal(await request('/movies/new/1'), '<div class="index-preview"></div>')
})

test('throws, naming the status, when the response is not a success', async () => {
  stub = stubFetch(() => html('Internal Server Error', 500))

  await assert.rejects(request('/movies/filter'), /500/)
})
