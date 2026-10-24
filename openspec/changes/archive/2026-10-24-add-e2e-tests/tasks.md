# Tasks

## 1. Harness

- [x] 1.1 Move the fixed test settings from `spec/spec_helper.rb` into `spec/support/test_env.rb`, and require it from `spec_helper` before the app loads. Verify the whole RSpec suite still passes
- [x] 1.2 Add `e2e/server.rb`: it requires `test_env`, sets `DATABASE_URL` to `MMDb_e2e`, blocks outbound HTTP except to localhost with WebMock, and runs `config.ru` on Puma at port 4667. Add `e2e/seed.rb`: it loads the schema when missing, empties every table, loads the seed data from design.md, and writes the movie search response. Verify that running the seed then the server serves the seeded user's movies page at `http://localhost:4667`
- [x] 1.3 Add `package.json` with Playwright pinned, `playwright.config.js` (Chromium, `workers: 1`, the `globalSetup` seed, the `webServer` wrapper), `e2e/fixtures.js` (abort non-app requests, serve the committed `e2e/vendor/jquery.min.js`), and Node and Playwright output in `.gitignore`. Add a smoke test that opens the movies page and finds the seeded posters. Verify `npx playwright test` passes, and that a request to an outside host is aborted

## 2. Flows

Each test passes against today's code. Show it fail by temporarily removing that flow's event binding in `mmdb.js`, then restore the binding.

- [x] 2.1 `e2e/drawer.spec.js`:
  - opening a movie shows its details under its row
  - another movie in the same row swaps the content
  - a movie in another row moves the drawer
  - clicking the open movie closes it
- [x] 2.2 `e2e/filters.spec.js`:
  - a title search narrows the grid
  - unwatched and 4K show only their movies
  - clear restores the full grid
- [x] 2.3 `e2e/add_movie.spec.js`: signed in, search with the recorded response, choose a result, and the movie appears in the grid with the count raised by one
- [x] 2.4 `e2e/edit_rate.spec.js`: signed in, open the reserved movie:
  - edit a field and see it after saving
  - rate it and see the rating kept on reopening
- [x] 2.5 `e2e/shows.spec.js`: signed in, open the show:
  - add an episode to a season and see it listed
  - set the default season and see it marked
- [x] 2.6 `e2e/modals_tabs.spec.js`:
  - the sign-in modal opens and closes
  - signing in through it works
  - the profile modal opens
  - the edit-show tabs switch panels
  - the theme switch swaps the stylesheet
- [x] 2.7 `e2e/artwork.spec.js`: signed in, in the edit-show form:
  - an answered upload fills the poster field and clears the message
  - an answered 502 shows its error message
- [x] 2.8 `e2e/delete.spec.js`: signed in, delete the reserved movie from its drawer, and it leaves the grid with the count lowered by one

## 3. CI and docs

- [x] 3.1 Add the Node, Chromium, `createdb MMDb_e2e` and `npx playwright test` steps to the `test` job in `.github/workflows/test.yml`, uploading the report on failure. Verify the workflow lint step passes
- [x] 3.2 Add a "Browser tests" section to `README.md` with the commands to run them locally, and check the commands work as written
- [x] 3.3 Run the whole RSpec suite, `npx playwright test` and `openspec validate add-e2e-tests --strict`, and verify all pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- Check that the PR's `test` check ran the browser tests, and read its time.
