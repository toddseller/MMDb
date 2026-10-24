# Tasks

## 1. Plan: find TVDB shows and their ids

- [x] 1.1 Add `spec/tvdb_migration_spec.rb` with WebMock stubs for TMDB `find`, TMDB `tv/<id>`, and Apple's show and episodes views (reusing `ShowSearchStubs` where it fits). Add examples for "show id already changed", "one season has a wrong collection id" and "deleted show's seasons are reported". Show them failing, then add `TvdbMigration.plan` until they pass

## 2. Plan: routes

- [x] 2.1 Add examples for the four routing scenarios (Apple covers every season, Apple lacks a season, Apple doesn't recognize the show, all-TVDB show) and for unresolved shows (no TMDB match, TMDB missing a season, unrecognized show id, failed request). Show them failing, then implement routing until they pass
- [x] 2.2 Add examples for the field changes: a TMDB season clears `skip`, `appleTvId` and `storeId`; an Apple season gets Apple's ids, `skip`, `count` and `storeId`; posters, titles and collection names are not in the plan. Show them failing, then implement until they pass
- [x] 2.3 Add examples for collisions with a stored show id, a stored season collection id, and two planned rows. Show them failing, then make `plan` refuse with every collision named until they pass. Verify `plan` writes no rows, by checking that `updated_at` is unchanged

## 3. Apply

- [x] 3.1 Add examples: a plan applies every change in one transaction; a row edited after the plan makes the apply change nothing and name the row; apply works with all network requests blocked (`WebMock.disable_net_connect!` and no stubs). Show them failing, then add `TvdbMigration.apply` until they pass

## 4. Script

- [x] 4.1 Add `bin/migrate-tvdb plan <file>` and `apply <file>` (executable), writing and reading the JSON plan and printing totals and unresolved shows. Add one example that runs `plan` and then `apply` through the script against stubbed sources, and verify it passes
- [x] 4.2 Run the whole suite and `openspec validate migrate-tvdb-ids --strict`, and verify both pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After deploy, follow design.md's migration plan with the user: run the dry run on the server and review the plan, take the `pg_dump`, apply, rerun the dry run, and spot-check episodes. Each production step needs the user's go-ahead.
