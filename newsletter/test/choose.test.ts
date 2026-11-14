import { test } from 'node:test'
import assert from 'node:assert/strict'
import { choose, type Holiday } from '../src/choose.ts'

const christmas: Holiday<string> = { from: [12, 1], to: [12, 26], templates: ['christmas'] }
const day = (iso: string) => new Date(`${iso}T00:00:00`)
const pick = (iso: string, regular = ['a', 'b'], holidays = [christmas]) => choose(day(iso), regular, holidays)

test('two regular templates alternate week to week', () => {
  assert.deepEqual(['2026-11-08', '2026-11-15', '2026-11-22', '2026-11-29'].map((d) => pick(d)), ['a', 'b', 'a', 'b'])
})

test('the last Sunday of December and the first of January differ outside a window', () => {
  assert.notEqual(pick('2026-12-27'), pick('2027-01-03'))
  assert.notEqual(pick('2027-12-26', ['a', 'b'], []), pick('2028-01-02', ['a', 'b'], []))
})

test('the Christmas window runs from December 1 to 26', () => {
  for (const d of ['2026-12-01', '2026-12-13', '2026-12-25', '2026-12-26']) assert.equal(pick(d), 'christmas', d)
  for (const d of ['2026-11-30', '2026-12-27']) assert.notEqual(pick(d), 'christmas', d)
})

test('a holiday with two templates alternates them', () => {
  const two = { ...christmas, templates: ['snow', 'tree'] }
  assert.deepEqual(['2026-12-06', '2026-12-13', '2026-12-20'].map((d) => pick(d, ['a'], [two])), ['snow', 'tree', 'snow'])
})

test('one regular template is always chosen outside windows', () => {
  assert.deepEqual(['2026-11-15', '2026-11-22', '2027-01-03'].map((d) => pick(d, ['only'])), ['only', 'only', 'only'])
})

test('the real templates: Christmas in December, the regular one otherwise', async () => {
  const { REGULAR, HOLIDAYS } = await import('../src/templates.ts')
  const { default: Christmas } = await import('../src/emails/christmas.tsx')
  const { default: Regular } = await import('../src/emails/regular.tsx')

  assert.equal(choose(day('2026-12-13'), REGULAR, HOLIDAYS), Christmas)
  assert.equal(choose(day('2026-11-15'), REGULAR, HOLIDAYS), Regular)
})
