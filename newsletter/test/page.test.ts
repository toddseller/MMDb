import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writePage } from '../src/page.ts'

const sunday = new Date('2026-11-15T00:00:00')

test('the page is named for its date plus 8 random characters', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))

  const name = await writePage(dir, sunday, '<p>issue</p>')

  assert.match(name, /^2026-11-15-[A-Za-z0-9_-]{8}\.html$/)
  assert.equal(await readFile(join(dir, name), 'utf8'), '<p>issue</p>')
})

test('two pages on the same day get different names', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'issues-'))

  assert.notEqual(await writePage(dir, sunday, 'a'), await writePage(dir, sunday, 'b'))
})

test('a folder that cannot be written fails', async () => {
  await assert.rejects(writePage('/nonexistent/issues', sunday, 'a'), /ENOENT/)
})
