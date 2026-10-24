import { test as base, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// The seed empties every table and restarts their ids, so its user is always 1.
export const USER = { id: 1, email: 'e2e@example.test', password: 'e2e-password' }
export const OTHER = { id: 2 }

// Test files that change data call this when they finish, so counts and rows are the seeded ones for every file.
export const reseed = () => execFileSync('bundle', ['exec', 'ruby', 'e2e/seed.rb'], { stdio: 'ignore' })

// The sign-in modal has its own test; other flows sign in the way it does, by an AJAX post to /sessions.
export const signIn = async (page) => {
  const response = await page.request.post('/sessions', {
    form: { username_email: USER.email, password: USER.password },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
  expect(await response.json()).toMatchObject({ status: 'true' })
}

// The page doesn't work without jQuery, so the CDN copy is answered with the same file instead of being blocked.
const jquery = readFileSync(new URL('./vendor/jquery.min.js', import.meta.url))

export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const app = new URL(baseURL).host
    // Routes added later in a test take precedence, so tests can still answer app requests themselves.
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url())
      if (url.host === app) return route.continue()
      if (url.pathname.endsWith('/jquery/1.9.1/jquery.min.js')) return route.fulfill({ body: jquery, contentType: 'application/javascript' })
      return route.abort()
    })
    await use(page)
  },
})

export { expect }
