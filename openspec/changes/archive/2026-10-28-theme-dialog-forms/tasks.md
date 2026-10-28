# Tasks

## 0. Branch

- [x] 0.1 Create `theme-dialog-forms` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Baseline

- [x] 1.1 Write a throwaway screenshot script in the scratchpad. It covers each dialog (Sign In, Account Settings, Add Movie, Edit Movie, ratings, Add Show, Create Show, Edit Show, New Episode), the registration page and the movies page with the filter box. Shoot each in both themes at 1500px and 390px, using the e2e fixture's seeded data with external images blocked. Run it against a `git worktree` of `master` with its own e2e server, and keep the screenshots as the baseline.

## 2. Guard tests first

- [x] 2.1 In `e2e/account.spec.js`, write failing tests for the spec's scenarios:
  - Account Settings in the dark theme: `.modal-content` is `--surface` dark (`#222`), the First Name field is `#2b2b2b` with a `#555` border, and the disabled New Password field is `#222`;
  - an unchecked Theme picker button is `#2b2b2b` and the checked one is `#3a3a3a`;
  - on System with Account Settings open, switching `emulateMedia` to dark turns the box and a field dark without a reload;
  - the sign-in dialog on a dark device has a dark box and still a red header.

  Change the existing "Remember me ... shares their border" test to expect `#555` in the dark theme and `#ccc` in the light. Run `npx playwright test e2e/account.spec.js` and see the new and changed checks fail for the dark theme only.
- [x] 2.2 In `spec/themes_spec.rb`, add a failing check that `modals.css` and `dialog.css` contain no `#fff`, `#ccc`, `#e6e6e6`, `#adadad` or `#333` in the colour rules this change moves (the theme picker, Remember me, `#logIn`), and that `palette.css` no longer defines `--button-focus-bg`. Also add `dialog.css` to the existing "no `light-dark(` outside the palette" list. Run `bundle exec rspec spec/themes_spec.rb` and see it fail.

## 3. Theme the dialogs, fields and buttons

- [x] 3.1 Add the design's ten palette entries to `palette.css` and delete `--button-focus-bg` once 3.3 removes its users.
- [x] 3.2 In `modals.css`, add the overrides from design.md: `.modal-content` (`--surface`, `--text`), `.modal-footer` border (`--divider`), `.form-control` with its disabled and read-only state, and `.btn-default` with each Bootstrap state selector list copied from `bootstrap.css`. Swap the theme picker's, `#logIn`'s and `.edit-next`'s fixed colours for their variables.
- [x] 3.3 Point `#edit-show`'s `.btn-default:hover` and `.btn:focus` rules at `--field-bg` and `--field-edge`. Swap the Remember me checkbox's `#fff`/`#ccc` in `dialog.css` for `--field-bg`/`--field-edge`.
- [x] 3.4 Raise the `?v=` on `palette.css`, `modals.css` and `dialog.css` in `app.css`. Verify the tests from 2.1 and 2.2 pass, along with `spec/page_assets_spec.rb`.

## 4. Compare and decide

- [x] 4.1 Run the screenshot script on the branch and diff every page against the baseline. The light theme must match pixel for pixel. Fix any light difference.
- [x] 4.2 Show the owner the dark theme's before and after screenshots of every dialog, the registration page and the filter box, and get approval before committing. Adjust only the dark side of a palette entry if they flag a colour, then rerun 4.1 and the tests from 2.1.

## 5. Verify

- [x] 5.1 Run the whole RSpec, JS and Playwright suites and verify all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `theme-dialog-forms`, archive the change in the same PR and open it with `gh`; the owner merges.
