import { afterEach } from 'node:test'

type Route = (url: URL, init: RequestInit) => Response | undefined

const original = globalThis.fetch
afterEach(() => { globalThis.fetch = original })

// Every request must match a route; anything else fails the test, naming the URL.
export const stubFetch = (...routes: Route[]) => {
  const calls: URL[] = []
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input))
    calls.push(url)
    for (const route of routes) {
      const response = route(url, init)
      if (response) return response
    }
    throw new Error(`Unstubbed request: ${url}`)
  }
  return calls
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export const tautulli = (cmd: string, respond: (params: URLSearchParams) => Response): Route =>
  (url) => url.host === 'plex.toddseller.dev' && url.searchParams.get('cmd') === cmd ? respond(url.searchParams) : undefined

export const tautulliData = (data: unknown) => json({ response: { result: 'success', data } })
