# Tasks

## 1. Migrations that run

- [x] 1.1 In a new `spec/migrate_task_spec.rb`, with a scratch PostgreSQL database built from `db/structure.sql` and every existing migration version recorded (`spec/support/scratch_database.rb`), add tests that `rake db:migrate` succeeds and changes nothing, and that `rake db:version` prints the latest version; show the migrate test failing on today's `ActiveRecord::Migrator.migrate` call, then rewrite the task in `Rakefile` with `ActiveRecord::MigrationContext` and verify both pass (`db:version` already works on 8.1)
- [x] 1.2 In `spec/deploy_script_spec.rb`, add tests that a deploy runs `compose exec -T web bundle exec rake db:migrate` before `compose restart web` (code-only change), before `compose up -d --build` (Gemfile change), and on a redeploy; and that a failing migrate (the fake `docker` exits non-zero for `exec`) makes the script exit non-zero with no restart. Show them failing, then add the step to `bin/deploy` and verify they pass
- [x] 1.3 Ask the user to run, on the server, a check that `schema_migrations` lists the version of every file in `db/migrate` (give them the exact command), and record the answer; if any are missing, stop and agree with the user how to mark them before going on Result: production recorded 25 of 26; `20230215100515` (AddShowCollectionId) had been applied by hand in 2023, so the user recorded it after checking the column exists, giving 26.

## 2. Handles

- [x] 2.1 Write the migration: add `users.handle`, fill it for every user in id order with the handle rule (a bare model class, no validations), then add its unique index and `NOT NULL`; create `user_handles` (`handle` with a unique index, `user_id` referencing `users` with `ON DELETE CASCADE`). In `spec/handle_migration_spec.rb`, show a test failing that runs it on a scratch database holding users named `Todd Seller`, `todd_seller` and `!!` and expects `todd-seller`, `todd-seller-2` and `user-<id>`, then make it pass. Add the same column, table, indexes and foreign key to `db/structure.sql`, and verify `bundle exec rspec` passes
- [x] 2.2 In a new `spec/handle_spec.rb`, add tests for `User`: a new user gets a handle from their user name, with `-2` on a clash and `user-<id>` when it has no usable characters; a handle is downcased; one breaking the rule (`-todd`, `to`, 31 characters, `to do`) is invalid; one held by another user, current or old, is invalid; changing it records the old one, which stays theirs; changing back removes it from the old ones. Show them failing, then add the rules, the default and `UserHandle` (`app/models/user_handle.rb`) and verify they pass

## 3. Addresses

- [x] 3.1 In a new `spec/collection_urls_spec.rb`, add tests that `/u/<handle>` and `/u/<handle>/shows` render the movies and shows pages and answer their background (XHR) requests with the same JSON as the numeric routes; an unknown handle answers 404; an old handle answers 301 to the current one, for both pages; `/users/<id>` and `/users/<id>/shows` opened as pages answer 301 to the handle address, keeping the query string; their XHR requests answer as before; and `/users/999999999` still answers the existing 500. Show them failing, then add the `/u/` routes, move the two page bodies into helpers shared with the numeric routes, add the redirects, and verify they pass with the whole suite (including `origin-security`'s error-page spec)
- [x] 3.2 Add view tests that the home page's collection links, the menu's Movies and TV Shows, and the Movies or TV Shows button on another user's collection use `/u/<handle>` addresses; show them failing, then change `_users.erb`, `layout.erb`, `users/show.erb`, `movies/show.erb` and `shows/show.erb`, and verify they pass
- [x] 3.3 Add a test that `POST /sessions` answers with the user's `handle`, and a test in `spec/js/account.test.js` that a successful sign-in goes to `/u/<handle>`; show both failing, then change `sessions_controller.rb` and `account.js`, and verify they pass

## 4. Account Settings

- [x] 4.1 In `spec/account_spec.rb` (where the Account Settings tests live), add tests that saving a new handle stores it downcased, that a rule-breaking or taken handle saves nothing and answers `status: "false"`, and that the form shows a "Handle:" field holding the current handle (labelled, `autocomplete="off"`) with the collection's address; show them failing, then add the field and its address to `_edit_user.erb`, save `handle` in `put '/users/:id'`, add the handle rule to the refusal message, and verify they pass

## 5. End-to-end

- [x] 5.1 The seeded users get handles from the model's default (`e2e`, `other`, `long`), so `e2e/seed.rb` is unchanged; add the handles to `e2e/fixtures.js` and add Playwright tests that: signing in lands on `/u/<handle>`; opening `/users/<id>` lands on `/u/<handle>` and shows the collection; the menu still switches between movies and TV shows in place; and changing the handle in Account Settings moves the collection to the new address while the old one redirects there. Update any test that expects a `/users/<id>` address. Show the new tests failing first, then verify the whole Playwright suite passes
- [x] 5.2 Take dark and light screenshots of Account Settings with the Handle field at 1500px and on a phone, and show them to the user for approval

## 6. Verify

- [x] 6.1 Run `bundle exec rspec`, `npm test` and `npm run typecheck`, and verify all pass
- [x] 6.2 Run `openspec validate public-collection-handles --strict` and verify it passes

## Workflow follow-up

- Run `ponytail:ponytail-review` on the diff and wait for the user's picks before committing.
- Commit the code, then archive the change as `Archive public-collection-handles`, and open one PR.
- After deploying, check that the deploy log shows the migration ran, that `/users/1` answers 301 to the right handle, and that the user's own collection opens at `/u/<handle>`.
