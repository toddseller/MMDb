# Tasks

## 0. Branch

- [x] 0.1 Create `merge-theme-stylesheets` from a freshly fetched `origin/master` and check with `git status` that you're on that branch and this change's artifacts came along. `add-system-theme`'s artifacts stay uncommitted for its own branch.

## 1. Baseline

- [x] 1.1 Write the throwaway screenshot script in the scratchpad: the pages in design.md ("Proving nothing else moved"), in both themes, at 1500px and 390px, with the e2e fixture's seeded data and external images blocked. Run it against a `git worktree` of `master` with its own e2e server, and keep the screenshots as the baseline.
- [x] 1.2 For every colour that only one theme's copy sets, record the computed value the other theme shows (from the baseline pages), so each `light-dark()` gets both sides.

## 2. Guard tests first

- [x] 2.1 In a new `spec/themes_spec.rb`, write failing checks:
  - `public/css/themes/` doesn't exist;
  - `palette.css` holds only custom properties on `:root`, each `light-dark(...)`;
  - `default.css` and `dark.css` import the identical list, each import versioned, and differ only in `:root { color-scheme: light | dark; }`;
  - the shared `layout.css`, `modals.css` and `movies.css` contain no `light-dark(`, so colours live only in the palette.

  Run `bundle exec rspec spec/themes_spec.rb` and see them fail.
- [x] 2.2 In `e2e/responsive.spec.js`, write a failing test that at 390px, in both themes, a movie drawer's rating, runtime and genre boxes don't overlap. Run it and see it fail in the light theme only.
- [x] 2.3 Rewrite the per-theme checks in `spec/detail_drawer_spec.rb` and `spec/page_assets_spec.rb` to point at the shared files: the show poster rule in `movies.css`, both poster colours as palette variables, the import versions and the versioned-import request (`/css/modals.css?v=2`). See them fail.

## 3. Merge

- [x] 3.1 Write `palette.css` with a role-named variable for each colour pair from the theme copies (and from 1.2), plus `layout.css`, `modals.css` and `movies.css` merged from the dark copy with the light-only rules folded in, as design.md describes. Take each drift row's pick: the dark layout, or delete for dead rules.
- [x] 3.2 Move any theme colours that the shared `drawer.css`, `dialog.css`, `navigation.css` or `responsive.css` override per theme into the palette, if the copies were overriding them.
- [x] 3.3 Reduce `default.css` and `dark.css` to the shared import list with fresh `?v=` versions, plus their `color-scheme` rule. Delete `public/css/themes/`. Verify the tests from 2.1-2.3 pass.

## 4. Compare and decide

- [x] 4.1 Run the screenshot script on the branch and diff every page against the baseline. The dark theme must match pixel for pixel, apart from the browser's own scrollbars and form controls, which now follow `color-scheme`. Every light theme difference must map to a design.md drift row; fix any that don't.
- [x] 4.2 Show the owner the light theme's before and after screenshots for the drift rows, and get approval before committing. Fix anything they flag, and rerun 4.1.

## 5. Verify

- [x] 5.1 Run the whole RSpec, JS and Playwright suites and verify all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `merge-theme-stylesheets`, archive the change in the same PR and open it with `gh`; the owner merges.
