# Tasks

## 1. Database show takes seasons only from its own source

- [x] 1.1 Add examples to `spec/show_search_spec.rb` for the spec's TMDB-sourced Lupin (database seasons 1 and 2 plus TMDB season 3, no Apple entries) and other-source extra season (Apple season 4 dropped) scenarios. Run them and show them failing because Apple entries are present
- [x] 1.2 Add examples for the Apple-sourced database show (TMDB entries dropped) and for no source returning the database id (only database seasons). Run them and record which fail today
- [x] 1.3 In `Show.get_series`, drop Apple and TMDB entries that belong to a database show by title and year unless their id matches and their season is missing, before the existing merge. Verify the new examples pass
- [x] 1.4 Run the whole suite and verify it passes, including the existing "prefers a season already in the database" and "Apple season whose year differs" examples

## 2. Verify

- [x] 2.1 Run `openspec validate db-show-season-source --strict` and verify it passes

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After merge and deploy, search `lupin` in Add TV Show on production and check that it shows the two database seasons plus TMDB season 3.
