# Design

## Context

The app is classic Sinatra (`config.ru` configures it and adds Rack middleware). Rack::Protection already sends `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` and `X-XSS-Protection`; Cloudflare adds HSTS and currently injects no scripts. `layout.erb` has one inline script, `<script type="importmap"><%== import_map %></script>`, whose text comes from `AssetHelper#import_map` and changes only when a JS file changes. Poster URLs come from the database and span about 15 hosts (Apple, TMDB, TheTVDB, `cdn.myflix.stream`, S3, Tumblr and others people pasted in). The browser tests run the app through `config.ru` (`e2e/server.rb`) and share a `page` fixture in `e2e/fixtures.js`.

## Goals / Non-Goals

**Goals:**
- A policy strict enough that injected markup could not run script, sent report-only.
- Violations from real traffic land in the server log; violations in tests fail CI.

**Non-Goals:**
- Enforcing the policy (a follow-up change).
- Narrowing `img-src` to a host list: posters come from hosts people paste, so a list would break new ones.
- The newer `report-to` / Reporting API: `report-uri` works in every current browser and needs no extra header.

## Decisions

- **Policy**: `default-src 'self'; script-src 'self' 'sha256-<import map>'; style-src 'self'; img-src 'self' https: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; report-uri /csp-reports`.
- **Hash, not nonce.** The import map is the only inline script. Its hash is `Digest::SHA256.base64digest(import_map)`, the exact text the layout writes. Computing it per response reuses the helper the layout already runs per request, needs no per-request random value threaded through the layout, and stays right in development when files reload.
- **Set the header in a Sinatra `after` filter, on every response.** The policy has no effect on JSON, so skipping API routes would add a condition for nothing. A filter can call the `import_map` helper directly; Rack middleware would have to duplicate it.
- **Fallback images by delegation.** `fallback.js` adds one capture-phase `error` listener on `document` (`error` doesn't bubble, but it is seen in the capture phase) that swaps an `img[data-fallback]` to its fallback and removes the attribute, so a missing fallback can't loop. On start it also handles images that already failed (`complete && naturalWidth === 0`), since a module runs after the HTML is parsed and an early failure would be missed. The three views use `data-fallback="/imgs/animated.svg"` or the existing S3 fallback.
- **Styles to classes.** The seven `display: inline-block !important` posters share one class in the stylesheet that already styles those lists; `#meta-data`'s `max-width` and the preview placeholder's width move to CSS rules. `!important` stays where it was, since it overrides a rule the original authors needed to beat.
- **Report endpoint.** `post '/csp-reports'` reads at most 8 KB + 1 byte of the body; more is 400. It parses the JSON and requires a `csp-report` object; otherwise 400. It logs `CSP <effective-directive or violated-directive> blocked <blocked-uri without query> on <document path without query>` with `puts`, as the app logs elsewhere, and answers 204. Browsers send `application/csp-report`, which `Rack::JSONBodyParser` leaves alone, so the route reads the raw body. Query strings are dropped because a page or blocked URL could carry a token.
- **Tests fail on violations.** The `page` fixture in `e2e/fixtures.js` adds an init script that records `securitypolicyviolation` events, and after each test asserts none were recorded. Report-only policies still fire that event, so every browser test checks the policy without blocking anything.

## Risks / Trade-offs

- [A Cloudflare feature later injects a script (Rocket Loader, bot detection)] → It would be reported, not blocked, and show up in the logs before enforcement.
- [Anyone can post to `/csp-reports`] → The body cap and one-line format bound what a flood can write; Cloudflare's rate limiting already covers the site.
- [`img-src https:` lets an injected image load from anywhere] → Images can't run script; the protection that matters is `script-src`.
- [Old episodes with `http://` artwork (26 rows)] → Browsers already upgrade or block mixed-content images on the HTTPS site, so the policy changes nothing for them; they would be reported.

## Migration Plan

Deploy as usual (restart only). Watch `docker logs mmdb-web-1 | grep '^CSP '` for a week or two of normal use, including MyFlix links and show editing. Then propose enforcement: rename the header to `Content-Security-Policy`. Rollback is removing the filter.
