# Design

## Context

- **The RSpec suite** (`spec/spec_helper.rb`) does four things before it loads the app: it forces `DATABASE_URL` to `postgres://localhost/MMDb_test`, sets fixed test values for every setting the code reads, loads `db/structure.sql` into an empty database, and blocks outbound HTTP with WebMock. Each example runs in a transaction that's rolled back. Factories live in `spec/support/factories.rb`.
- **The front end** is `layout.erb` loading jQuery 1.9.1 from Google's CDN, Bootstrap 3.3.6's JavaScript, `mmdb.js` and `application.js`, plus Google Tag Manager and Optimizely. Most interactions are AJAX requests to the app that swap in server-rendered HTML.
- **Some flows reach outside services from the server:**
  - movie search calls Apple and TMDB (`Movie.get_titles`)
  - artwork upload calls S3
  - some show routes look up episodes
- **CI** is one `test` job on `ubuntu-latest`, which has Node, with Postgres 11 as a service. The `master` ruleset requires a check named `test`.

## Goals / Non-Goals

**Goals:**
- Implement `specs/ci-test-gate/spec.md`. The eight flows must pass against today's code, and each test must be able to fail when its flow breaks.

**Non-Goals:**
- Changing application code or the JavaScript.
- JavaScript unit tests, which come with the rewrite.
- Testing more than one browser.
- Visual comparison of screenshots.

## Decisions

**Playwright Test (Node) with Chromium only.** It waits for elements automatically, intercepts requests per test, and records a trace on failure that can be stepped through. Cuprite would reuse the RSpec factories, but the rewrite needs Node tooling for its unit tests anyway, so one Node toolchain serves both.

**The app runs under a Ruby wrapper, `e2e/server.rb`, on port 4667.**
- The fixed test settings move from `spec_helper.rb` into `spec/support/test_env.rb`. Both `spec_helper` and the wrapper require it, so the values can't drift apart.
- The wrapper sets `DATABASE_URL=postgres://localhost/MMDb_e2e` before loading the app, so a local `.env` can't point it at production.
- It enables WebMock with `disable_net_connect!(allow_localhost: true)`, so an unstubbed outbound request raises and names the URL, as in RSpec.
- It runs `config.ru` on Puma.

Port 4667 keeps it clear of a local development server on 4666.

**Its own database, `MMDb_e2e`.** Leftover rows from the browser tests would break RSpec's count-based checks if they shared `MMDb_test`. `e2e/seed.rb` creates the schema from `db/structure.sql` when it's missing, empties every table, then loads known data with the RSpec factories:
- **a user with a test password:** a fixed test value written in the seed file, not a real credential
- **about 30 movies**, enough for several rows of 7:
  - one marked new
  - one marked 4K
  - distinct titles for search
  - one each reserved for the edit, rate and delete tests
- **a show** with three seasons of episodes

Playwright's `globalSetup` runs the seed once per run.

**Isolation in the browser.** A shared fixture, `e2e/fixtures.js`, gives every test a page that aborts any request not addressed to the app. That covers the jQuery CDN, GTM, Optimizely and poster images.

jQuery can't be blocked: the page doesn't work without it. So `jquery.min.js` 1.9.1 is served from a copy committed under `e2e/vendor/`, answered by the route intercept. Poster requests get the existing `onError` placeholder, which is fine for these tests.

**Answering outside services at the browser.**
- **Movie search:** the browser's `GET /movies?query=…` is answered with a recorded response. To keep its markup in step with the real partial, the seed script renders `_preview` with fake search rows and writes `e2e/.generated/movie_search.json`. Choosing a result then posts to the real app, which creates the movie with no outside call.
- **Artwork upload:** the browser's `POST …/artwork` is answered with `{url}` for the success test and a 502 with `{error}` for the failure test.

A flow that turns out to call out from the server is answered the same way, and noted in the test.

**Tests run one at a time (`workers: 1`)** against the one seeded database. Tests that change data use their own reserved rows, so the order doesn't matter, and no reseed per test is needed.

**Every test is shown to catch a failure.** Each flow test is written against today's code and must pass. To show it can fail, temporarily remove the event binding for that flow in `mmdb.js`, see the test fail with a clear message, then restore the binding.

**CI:** the `test` job gains these steps after `bundle exec rspec`:
1. `actions/setup-node`
2. `npm ci`
3. `npx playwright install --with-deps chromium`
4. `createdb MMDb_e2e`
5. `npx playwright test`

On failure it uploads the Playwright report as an artifact. They stay in the one required job, so the ruleset doesn't need changing.

## As built

Differences from the plan above, found while implementing:

**Data-changing files reseed when they finish.** Adding and deleting movies changes the counts and the row layout that other files rely on, so reserved rows alone weren't enough. `add_movie`, `delete`, `edit_rate` and `shows` call the seed in `afterAll`, and every file starts from seeded data. The full run is 22 tests in about 27 seconds.

**More recorded responses.** Adding an episode starts with the "Add TV Show" search (Apple and TMDB) and a season pick (TMDB episode lists). The seed records both the way it records the movie search, by calling the real route in-process with `Show.get_series` and `Show.get_episodes` replaced. For the season pick it posts exactly the hidden fields of the recorded search form. The episode itself is added by the real app.

**Seed data fixes.** The seed fills every credit field and marks one season active, as real data always has. Without them the details routes raise.

**`127.0.0.1`, not `localhost`.** Node can resolve `localhost` to `::1`, miss the server on `127.0.0.1`, and try to start a second one.

**Break checks that needed stronger tests.**
- **Adding an episode:** with the script removed, the form still posted natively and the episode was saved. So the test also checks that the page stays on the shows grid.
- **The Profile submenu:** a closed submenu is clipped to no height, so its links still count as visible. So the test checks the submenu's height.
- **Bootstrap's own JavaScript** (the sign-in modal and the edit-show tabs): checked by blocking `bootstrap.min.js` in the browser for one run. Moving the file away instead makes `asset_path` raise on every page.

**Quirks in today's code for the rewrite to know about.**
- `displayEditForm` replaces every `.modal-body` on the page, so the movie edit form is also copied into the hidden sign-in modal.
- The sign-in form's labels aren't tied to their inputs.
- Several icon-only controls have no accessible name: the menu button, the "…" edit links, and the episode buttons.

## Risks / Trade-offs

- [A slow CI step] → Chromium only, installed in a single step. About 20 tests against a local server should take under a minute after the install.
- [Tests depending on CSS animation timing] → Wait for states (the drawer has `open`, a request has finished) rather than fixed delays.
- [The committed jQuery copy] → It's only used by the tests, and goes away when the rewrite removes jQuery.
- [A server route calls out in a way that hasn't been found] → WebMock makes it fail loudly with the URL. Answer it at the browser and record that in the test.

## Migration Plan

Test tooling only, so nothing to deploy. Roll back by reverting the commit.
