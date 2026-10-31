# Proposal

## Why

A collection's address is its owner's database id, `/users/1`, which says nothing about whose collection it is and invites counting through `/users/2`, `/users/3`. A readable handle (`/u/todd-seller`) makes the links people share and bookmark mean something. The id stays the key everywhere else, because changing it would touch every foreign key, session, myflix token and the Plex webhook for no visible gain.

## What Changes

- Every user gets a `handle`: unique, 3 to 30 characters of lowercase letters, digits and hyphens, starting and ending with a letter or digit. Existing users and new sign-ups get one made from their user name (`Todd Seller` becomes `todd-seller`), with `-2`, `-3` added when it's taken, and `user-<id>` when the user name has no usable characters.
- A collection's pages live at `/u/<handle>` (movies) and `/u/<handle>/shows` (TV shows), for full page loads and for the page's own background requests.
- Opening the old `/users/<id>` or `/users/<id>/shows` as a page answers a permanent redirect (301) to the handle's address, so bookmarks and shared links keep working. The page's own background requests to those routes keep working unchanged.
- Owners can change their handle in Account Settings. The old handle keeps redirecting to the new one, and stays reserved to that owner, so a shared link never starts pointing at someone else's collection.
- Links that lead to a collection use the handle: signing in, the home page's collection list, the menu's Movies and TV Shows, and the Movies or TV Shows button on another user's collection.
- An unknown handle answers 404.
- Unchanged: the numeric id in sessions, the myflix API and its tokens, the Plex webhook, the page's internal routes (details, adding, editing, filters, artwork), and the Unwatched and 4K filters, which are background requests only.

## Capabilities

### New Capabilities

- `collection-urls`: how a collection is addressed: the handle and its rules, the `/u/` pages, redirects from numeric ids and old handles, links that use the handle, and changing the handle in Account Settings.

### Modified Capabilities

- `user-account`: signing in goes to the collection's handle address instead of `/users/<id>`.
- `deploy-on-tag`: a deploy applies pending database migrations before restarting the app, and fails if they fail. Deploys have never run migrations, and the Rakefile's `db:migrate` no longer works on ActiveRecord 8.1, so this change is the first schema change since tag deploys began.

## Impact

- Data: a migration adds `users.handle` (unique, filled in for existing users) and a `user_handles` table of old handles, each belonging to its user; `db/structure.sql`, the production schema the tests load, gains both.
- Deploy: `bin/deploy` runs `rake db:migrate` in the web container before restarting, and the Rakefile's `db:migrate` is rewritten for ActiveRecord 8.1's `MigrationContext`.
- Models: `app/models/user.rb` (handle rules, the default from the user name, keeping old handles).
- Routes: `app/controllers/users_controller.rb` and `app/controllers/users_shows_controller.rb` (the `/u/` pages and the redirects), `app/controllers/sessions_controller.rb` (the sign-in response names the handle), `users_controller.rb` again for saving the handle.
- Views: `app/views/layout.erb` (menu links), `app/views/partials/_users.erb` (home page list), `app/views/users/show.erb`, `app/views/movies/show.erb` and `app/views/shows/show.erb` (Movies or TV Shows button), `app/views/partials/_edit_user.erb` (the handle field).
- Scripts: `public/js/mmdb/account.js` (where sign-in goes).
- Tests: Ruby specs for the model, routes, redirects, settings, the migration and `bin/deploy`; JS tests for sign-in; the e2e seed and the tests that open `/users/<id>`.
- The myflix client, the Plex webhook and the API are untouched.
