# Design

## Context

Collections are addressed by `users.id`: `get '/users/:id'` (movies) in `users_controller.rb` and `get '/users/:user_id/shows'` in `users_shows_controller.rb` each render a full page, or a JSON `{ page, ... }` for the page's own background requests (`request.xhr?`). Those background requests come from the menu's Movies and TV Shows (`navigation.js` fetches the link's `href` and swaps the page in place, so the address bar never changes), the Movies or TV Shows button on another user's collection, and Clear (`filters.js`, which builds `/users/<id>` from the grid tiles' `id` attribute). The only addresses a person sees are full page loads: where sign-in goes (`account.js` goes to `/users/<user_id>` from the `/sessions` response), the home page's collection list (`_users.erb`), and links opened in a new tab.

`users.user_name` is required and unique, but it is also a sign-in name (`sessions_controller.rb` accepts it in place of the email), owners edit it in Account Settings, and it is free text. The database is PostgreSQL 11; production runs one Puma process.

## Goals / Non-Goals

**Goals:**
- Readable, stable collection addresses, with every old link still arriving at the right collection.

**Non-Goals:**
- Changing `users.id` or how anything else refers to a user (sessions, myflix tokens, the Plex webhook, foreign keys, the internal `/users/:user_id/...` routes).
- Making collections private or unlisted; they stay public, as the home page already lists them.
- Moving the Unwatched and 4K filters, which only answer background requests.

## Decisions

**A separate `handle` column, not `user_name`.** Keeping the sign-in name out of addresses means a URL never gives away half of a sign-in, and a handle can follow strict URL rules without forcing anyone to rename themselves. The default is made from the user name with ActiveSupport's `parameterize` (already loaded with ActiveRecord): accents dropped, lowercased, other runs turned into hyphens. Then it's trimmed to 30 characters, trailing hyphens are stripped, and `-2`, `-3`, ... are added on a clash. Under 3 characters it falls back to `user-<id>`. New users get it in a `before_validation` on create, so the id fallback needs the record saved first: such users are saved, then given `user-<id>` in an `after_create`.

**Old handles in their own table.** A `user_handles` table (`handle` unique, `user_id` referencing `users`) keeps every handle a user has given up. When a save changes `handle`, the old value is added there, and the new value is removed from it if it was one of this user's old handles (changing back). The validation for a handle checks both `users.handle` and `user_handles.handle` belonging to another user. Two unique indexes can't stop the same string appearing once in each table under a race between two saves. With one Puma process, a handful of users and a save that is a rare manual act, the model check is enough. This is recorded as a known limit rather than solved with a trigger.

Alternative considered: a `previous_handles` array column on `users`. Looking up an old handle would then need an array search, and it couldn't carry a unique index.

**New `/u/` routes beside the old ones.** `get '/u/:handle'` and `get '/u/:handle/shows'` look the user up by `handle`. If there's no match, an old handle in `user_handles` answers a 301 to the same page under the current handle, and anything else answers 404. A match renders exactly what the numeric routes render today: the bodies of `get '/users/:id'` and `get '/users/:user_id/shows'` move into two helpers, used by both. The old routes keep serving background requests as they are, and answer a full page load with a 301 to the handle address, keeping the query string. A numeric id with no user keeps today's 500 from `User.find`, which `origin-security`'s error-page scenario relies on.

The `/u/` prefix keeps handles out of the way of every existing route, so no handle needs reserving.

**Links switch, background requests mostly stay.** The menu links, the other-collection button and the home page list use the handle, because they can be opened in a new tab. Clear keeps building `/users/<id>` from the tile ids. It's a background request and is answered without a redirect, so it needs no change. The `/sessions` response gains `handle`, and `account.js` goes to `/u/<handle>`.

**Account Settings.** A "Handle:" field (`name="handle"`, `autocomplete="off"`, with `pattern` and `maxlength` hints matching the rule) goes after User name, with the collection's address under it. `put '/users/:id'` saves `handle` downcased alongside the other fields. A refused save answers `status: "false"` as today, and the dialog shows its one refusal message. That message ("Couldn't save. Check your current password, email and user name, and that a new password has at least 8 characters.") gains the handle and its rule, rather than a per-field message system nobody asked for.

**Deploys run migrations, every time.** Tag deploys have never run migrations, and the Rakefile's `db:migrate` calls `ActiveRecord::Migrator.migrations_paths` and `.migrate`, class methods ActiveRecord removed long before 8.1. So the last migration (2023) was applied by hand. The Rakefile's `db:migrate` moves to `ActiveRecord::MigrationContext.new(APP_ROOT.join('db', 'migrate'))`; `db:version` still works. `bin/deploy` runs `docker compose exec -T web bundle exec rake db:migrate` after moving `master` and before the restart or rebuild, and refuses (exits non-zero) if it fails. It gives that command an empty input (`< /dev/null`): `exec -T` passes on the SSH session's input, which never closes, and a check run that way on the server hung until it was given `ssh -n`.

It runs on every deploy, not only when `db/migrate` changed. A run with nothing pending costs a second. More importantly, a deploy that fails in its migrations has already moved `master`, so a retry of the same tag has no diff to look at and would skip them. The migration runs in the container that is already up, with the image's current gems, before a rebuild for changed gems; a plain ActiveRecord migration needs nothing newer. Before merging, the server's `schema_migrations` is checked to list every existing migration, so only the new one runs.

Alternative considered: a one-time manual migration on the server for this release. It changes nothing permanent, but leaves the next schema change with the same gap; the user chose the deploy step.

**`db/structure.sql` follows the migration.** The tests load `db/structure.sql`, a `pg_dump --schema-only` of production, because the old migrations don't rebuild production's schema. It is edited to add the column, the table, their indexes and the foreign key exactly as the migration creates them. Being schema-only, it records no migration versions, so a test that runs migrations first records every existing version, as production's database already does.

**The migration fills in existing users.** It adds `handle` (nullable), fills it for every user in id order with the same rule, using a bare model class so validations and callbacks from today's `User` don't run, then adds the unique index and `NOT NULL`. It creates `user_handles` with its unique index and foreign key.

## Risks / Trade-offs

- [The same handle saved by two users at the same instant] → Possible in theory with one Puma process running 3 threads. Saving a handle is a rare, manual action; noted rather than guarded with a database trigger.
- [A user name that becomes a handle someone dislikes, such as an old nickname] → They can change it in Account Settings, and the old one keeps redirecting to them.
- [Links already shared as `/users/<id>` live on] → They redirect permanently, and browsers and search engines will update them.
- [A user deleted later frees their handles, which a new user could take] → No delete-user path exists today; the `user_handles` foreign key cascades, so this would need revisiting if one is added.

- [Production's `schema_migrations` is missing an old migration's version, so `db:migrate` would try to run it] → Checked on the server before merging. Any missing versions are inserted by hand, so the old migration is marked as done rather than run.
- [The web container isn't running when a deploy starts, so `docker compose exec` fails] → The deploy refuses with the error. The server keeps the container up, and a stopped container is already an outage to fix by hand.

## Migration Plan

Before merging, check on the server that `schema_migrations` lists every file in `db/migrate`. Deploy as usual with a `vYYYY.MM.DD.N` release: the deploy runs the migration, which fills in handles, before the restart that starts serving the new routes. After deploying, check that `/users/1` answers a 301 to the right handle. To roll back, revert the PR and release again; the extra column and table are harmless if left, or can be dropped by rolling the migration back.
