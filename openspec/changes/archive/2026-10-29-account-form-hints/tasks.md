# Tasks

## 0. Branch

- [x] 0.1 Create `account-form-hints` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Account Settings checks the length

- [x] 1.1 In `spec/js/account.test.js`, change the settings examples' new passwords to 8 or more characters, and add failing examples: a 7-character new password and the same in confirm holds Update and shows "Use at least 8 characters" in `#no-match`; a long enough mismatch shows "Passwords do not match"; a match hides the message; a 4-emoji password counts as 4 characters and is refused. Add `#no-match` to the test's settings markup. Run `npm test` and see the new examples fail on the missing messages.
- [x] 1.2 In `public/js/mmdb/account.js`, add `passwordProblem(password, confirm)` (length by `[...password].length`, then match) and use it in `confirmChanged` to write and show or hide `#no-match` and to decide Update. Verify `npm test` passes.

## 2. Registration checks the length

- [x] 2.1 In `spec/js/account.test.js`, add a failing example: a 7-character password and the same confirmation, after the 1.5-second pause, shows "Use at least 8 characters" and keeps Register disabled. Make sure the existing registration examples use passwords of 8 or more characters. Run it and see it fail.
- [x] 2.2 Use `passwordProblem` in `checkRegistration`. Verify `npm test` and `npm run typecheck` pass.

## 3. Labels, hints and placeholders

- [x] 3.1 In `e2e/account.spec.js`, add failing tests: in Account Settings, `getByLabel('Current Password:')` finds the current field, clicking the label focuses it, its placeholder is "Only needed to change your password" and its `autocomplete` is `current-password`, while the new and confirm fields are `new-password` with the new one's placeholder "At least 8 characters"; on the sign-in dialog, `getByLabel` finds both fields and they are `username` and `current-password`; on the registration page, `getByLabel` finds every field and the passwords are `new-password` with "At least 8 characters". Run them and see them fail.
- [x] 3.2 Add the prefixed `id`s, matching `for`s, `autocomplete` hints and the placeholders in `app/views/layout.erb`, `app/views/partials/_edit_user.erb` and `app/views/users/new.erb`, keeping `name` attributes and wrapper `div` ids. Verify the 3.1 tests pass.

## 4. Settings' too-short refusal moves to the page

- [x] 4.1 In `e2e/account.spec.js`, change "a new password under 8 characters is refused" to check that `seven77` keeps Update disabled and shows "Use at least 8 characters", and add a test that a 73-character new password is refused by the server with the dialog's error message. Make the registration mismatch test's passwords stay 8 or more characters. Verify `npm run test:e2e -- e2e/account.spec.js` passes.

## 5. Verify

- [x] 5.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.
- [x] 5.2 Take screenshots of Account Settings (too short, mismatch, match) and the registration page (too short) in the dark and light themes, and show them to the owner for approval before committing.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `account-form-hints`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
