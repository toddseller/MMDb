# Tasks

## 0. Branch

- [x] 0.1 Create `password-and-session-rules` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Tests sign in with passwords the new rule accepts

- [x] 1.1 Change `create_user`'s default password in `spec/support/factories.rb` to `'secret-password'`, and every Ruby spec that signs in, registers or confirms with `'secret'` to `'secret-password'` (`git grep -n "'secret'" -- spec ':!spec/js'`). Leave wrong-password values such as `'wrong'` alone. Verify that `bundle exec rspec` passes before any rule exists.

## 2. A new password is 8 characters to 72 bytes

- [x] 2.1 Create `spec/password_rules_spec.rb` with failing examples: registration with an empty password creates no user and redirects with an error naming the password; Account Settings with the right current password and a 7-character new one answers `status: "false"` and the old password still signs in; `/api/v3/signup` with a 73-byte password answers 422 naming the password and creates no user; registration with an 8-character and with a 72-byte password both create a user who can sign in. Run it and see the refusal examples fail because the passwords are saved.
- [x] 2.2 Add the length validation to `User` as in design.md: `password=` keeps the plain value, and a validation that runs only when it is set adds the two messages to `password`. Verify that 2.1 passes, and that `bundle exec rspec` passes.

## 3. The settings message names the rule

- [x] 3.1 Change the expected text in `spec/js/account.test.js`'s fixture and in `e2e/account.spec.js` (both places) to "Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.", and add an e2e example to `e2e/account.spec.js` that submits Account Settings with the right current password and a 7-character new one and sees that message. Run `npx playwright test e2e/account.spec.js` and see the text examples fail.
- [x] 3.2 Change the paragraph in `app/views/partials/_edit_user.erb` to the new text. Verify that 3.1, `npm test` and `e2e/account.spec.js` pass, then take a screenshot of the dialog showing the message for the owner's approval before the commit.

## 4. A password change ends other web sessions

- [x] 4.1 Create `spec/password_change_spec.rb` with failing examples, using two browsers by saving and swapping `@cookie` and reading signed-in state as `spec/session_expiry_spec.rb` does: after browser A changes the password in Account Settings, browser B is signed out and A is still signed in; after A saves Account Settings without a new password, B stays signed in; a session started by `post '/api/v2/authenticate'`, which carries no fingerprint, is signed out on its next page. Run it and see the sign-out examples fail.
- [x] 4.2 Add `User#password_fingerprint`, store it in the session in `post '/sessions'`, registration and a successful `put '/users/:id'`, compare it in `refresh_session` (keeping the loaded user as `@current_user`), and drop both in `sign_out!`, as in design.md. Verify that 4.1, `spec/session_expiry_spec.rb`, `spec/account_spec.rb` and `spec/collection_access_spec.rb` pass.

## 5. A password change invalidates API tokens

- [x] 5.1 In `spec/password_change_spec.rb`, for `v2` and `v3`, add failing examples: a token issued before the user changes their password gets a 401 with a JSON `message` from `/api/<version>/counts`, and one issued after gets a 200; a token without a `pwd` claim gets a 401. Add the `pwd` claim to `spec/api_auth_spec.rb`'s hand-built `token` helper. Run both files and see the new examples fail.
- [x] 5.2 Add the `pwd` claim to `JwtAuth.payload` and the fingerprint check to `JwtAuth.decode`, raising `JWT::DecodeError` as in design.md. Verify that 5.1, `spec/api_auth_spec.rb`, `spec/api_owner_spec.rb` and `spec/settings_spec.rb` pass.

## 6. Verify

- [x] 6.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Show the owner the 3.2 screenshot and get approval before the first commit.
- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `password-and-session-rules`, archive the change in the same PR and open it with `gh`; the owner merges.
- After the deploy, run the check in design.md's Migration Plan.
