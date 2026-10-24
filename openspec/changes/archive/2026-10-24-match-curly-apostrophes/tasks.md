# Tasks

## 1. Match names regardless of apostrophe style

- [x] 1.1 Add examples to `spec/show_search_spec.rb` for the spec's two new scenarios (Apple "Lupin’s Tales" against TMDB "Lupin's Tales", and a database "Lupin's Tales" against Apple "Lupin’s Tales"). Run them and show them failing because both spellings appear
- [x] 1.2 Add `Show.same_name?` and use it in the Apple merge, the TMDB merge and `from_stored_source?`. Verify the new examples pass
- [x] 1.3 Run the whole suite and `openspec validate match-curly-apostrophes --strict`, and verify both pass

## Workflow follow-up

- Work on a feature branch, archive the change as the last commit of the PR, and open the PR with `gh`.
- After deploy, search `lupin` on production and check that "Lupin’s Tales" appears once per season.
