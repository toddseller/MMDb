# Tasks

## 0. Branch

- [x] 0.1 Create `json-body-parser-json3` from a freshly fetched `origin/master` (which has httparty 0.24.3 from #470), and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. A malformed JSON body still gets a 400

- [x] 1.1 In `spec/api_auth_spec.rb`, add one example that posts `{not json` with `CONTENT_TYPE` `application/json` to `/api/v2/authenticate` and expects 400 with `Failed to parse body as JSON`. Run it and verify it passes on the current parser, since it guards behavior the fix must keep.

## 2. JSON bodies parse on json 3

- [x] 2.1 Show the failure: run `bundle update json --conservative` to lock json 3.1.0 locally, then run `bundle exec rspec spec/api_auth_spec.rb` and see the token examples fail because sign-in answers 400 (`create_additions` unknown to json 3).
- [x] 2.2 In `config.ru`, change `use Rack::JSONBodyParser` to pass a `do |body| ... end` block calling `JSON.parse(body)`, with a one-line why comment (rack-contrib's default parser passes an option json 3 removed). Verify `spec/api_auth_spec.rb` passes on json 3.1.0, including 1.1.
- [x] 2.3 Run the whole RSpec suite on json 3.1.0 and verify it passes. Then restore `Gemfile.lock` with `git checkout Gemfile.lock` and `bundle install`, and verify `git diff --stat` shows only `config.ru` and `spec/api_auth_spec.rb` outside `openspec/`.

## 3. Verify

- [x] 3.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e` on json 2, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `json-body-parser-json3`, archive the change in the same PR and open it with `gh`. The owner merges and deploys.
- After merging: comment `@dependabot rebase` on #471 and check its `test` job passes.
