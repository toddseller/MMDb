# Tasks

## 1. Link each stylesheet with its own version

- [x] 1.1 In `spec/page_assets_spec.rb`, change the asset test to expect every `/css/` link to match `/css/<name>.css?v=<digits>` (12 assets: `main.js` plus the 11 stylesheets in today's `app.css` order, read from the rendered `<link>` tags), add a test that touching `public/css/movies.css` changes only that link's version (as the `events.js` test does for modules), and replace "imports modals.css with a version" with a test that no file in `public/css/` contains `@import`; show them failing, then loop over the 11 names in `app/views/layout.erb` through `asset_path`, delete `public/css/app.css`, and verify they pass
- [x] 1.2 Move the other Ruby specs off `app.css`: in `spec/themes_spec.rb` check the rendered page links `palette`, `layout`, `modals` and `movies` with versions (in place of reading `app.css`'s imports); in `spec/detail_drawer_spec.rb` check it links `drawer.css` and `movies.css` with versions; in `spec/account_spec.rb` check every stylesheet link is under `/css/` with a `?v=` and the set is the same for the default and dark themes; verify `bundle exec rspec` passes

## 2. End-to-end

- [x] 2.1 Point `useTheme` in `e2e/fixtures.js` and the scrollbar test in `e2e/scrollbar.spec.js` at `**/css/responsive.css*`, and change the two `toHaveCount(1)` checks in `e2e/account.spec.js` to compare the stylesheet links before and after the theme pick; verify the whole Playwright suite passes
- [x] 2.2 Take dark and light screenshots of the movies page and an open show drawer at 1500px and phone width, compare them with the same pages on `master`, and show them to the user for approval (nothing on screen should change)

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test` and `npm run typecheck`, and verify all pass
- [x] 3.2 Run `openspec validate version-stylesheets --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user's picks before committing.
- Commit the code, then archive the change as `Archive version-stylesheets`, and open one PR.
- After the release deploys, check the live page links each stylesheet with a `?v=`, then delete the `bump-css-import-versions` memory note.
