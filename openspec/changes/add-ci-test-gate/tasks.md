# Tasks

Test-first throughout: write the test, run it and see it fail for the right reason, then write the smallest code that passes, then run the whole suite. Work on the branch `add-ci-test-gate`.

## 1. Load the harness from one place

- [x] 1.1 Create the branch `add-ci-test-gate` from `master`; verify `git status -sb` shows it
- [x] 1.2 Add `--require spec_helper` to `.rspec`, move `spec/request_helper.rb` to `spec/support/request.rb`, have `spec_helper` load `spec/support/*.rb`, and remove the `require_relative` lines from the specs (design decision 7); verify `grep -rn require_relative spec` finds nothing and `bundle exec rspec spec/show_spec.rb` and the whole suite pass

## 2. Fixed test settings (spec: The suite runs without secrets)

- [x] 2.1 Write `spec/settings_spec.rb`: `ENV['JWT_SECRET']` is `test-jwt-secret` and `ENV['TAUTULLI_KEY']` is a test value even though the local `.env` sets real ones, and a token from `JwtAuth.token(user)` decodes with `JwtAuth.decode` to that user's id; run it and see the value examples fail because the real `.env` values are loaded
- [x] 2.2 In `spec_helper`, assign fixed test values to every variable listed in design.md (Context) before requiring `config/environment` (design decision 3); verify 2.1 passes and the whole suite passes

## 3. No network in tests (spec: Tests never reach external services)

- [x] 3.1 Write `spec/network_spec.rb`: an unstubbed `HTTParty.get` to a TMDB URL raises `WebMock::NetConnectNotAllowedError` whose message names that URL, and a request stubbed with `stub_request` returns the stubbed body; run it and see it fail with `NameError` (WebMock not loaded)
- [x] 3.2 Add `webmock` to the `test` group of the `Gemfile`, `bundle install`, and add `spec/support/webmock.rb` calling `WebMock.disable_net_connect!` (design decision 4); verify 3.1 passes, `Gemfile.lock` still lists `x86_64-linux` under PLATFORMS, and the whole suite passes

## 4. Shared factories

- [x] 4.1 Write `spec/factories_spec.rb`: two `create_user` calls give different user names and emails, and both can log in with the default password; `create_show(user, seasons: [1, 3])` belongs to the user and has seasons 1 and 3 with one episode each; `create_movie(user)` belongs to the user; run it and see it fail with `NoMethodError`
- [x] 4.2 Add `spec/support/factories.rb` (design decision 5), included into every example; verify 4.1 passes
- [x] 4.3 Replace the local `create_user`, `create_show` and movie set-up in `smoke_spec.rb`, `shows_page_spec.rb` and `grid_responses_spec.rb` with the shared factories; verify `grep -rn "def create_" spec` lists only `spec/support/factories.rb` and the whole suite passes with the same example count plus the new ones

## 5. Coverage report (spec: Each run reports coverage)

- [x] 5.1 Add `simplecov` to the `test` group, start it at the top of `spec_helper` before anything else loads, tracking `app/` and `config/` and filtering `spec/`, with no minimum (design decision 6); verify a run prints the line-coverage total, writes `coverage/index.html`, `git status` does not show `coverage/`, and the whole suite passes

## 6. Comments

- [x] 6.1 Rewrite the query counter comment in `spec_helper` to give the reason `SCHEMA` and `TRANSACTION` events are skipped, and delete the comment at the top of `grid_responses_spec.rb` (design decision 10); verify by reading both files and running the whole suite

## 7. Documentation

- [x] 7.1 Replace "Run tests (if configured)" in `README.md` with a Testing section: starting Postgres, `createdb MMDb_test`, `bundle exec rspec`, where the coverage report is written, how to refresh `db/structure.sql` from production (`pg_dump --schema-only --no-owner --no-privileges`, then drop the `\restrict` lines), that tests may not reach the network, and the `pending` policy for bugs (design decision 9); verify by running the documented commands as written against a freshly created `MMDb_test`

## 8. CI workflow (spec: The suite runs on every pull request and push to master; Tests run against the production schema)

- [x] 8.1 Add `.github/workflows/test.yml` per design decisions 1 and 2: a job named `test` (with a comment saying the required check matches that name), `postgres:11` service with a health check, `ruby-version: 3.4.8`, `bundler-cache: true`, `PGHOST`/`PGUSER`/`PGPASSWORD`, `createdb MMDb_test`, `bundle exec rspec`, and an upload of `coverage/` with `if: always()`; verify the file parses with `ruby -ryaml -e 'YAML.load_file(".github/workflows/test.yml")'`
- [x] 8.2 Commit the change, push the branch, and have the owner open a pull request to `master`; verify through the GitHub API (`/repos/toddseller/MMDb/commits/<sha>/check-runs`) that the `test` check ran on the latest commit and passed, that its log shows the line-coverage total, and that the run offers the coverage artifact

## 9. Merge gate (spec: A failing suite blocks the merge)

- [x] 9.1 Owner creates the ruleset on GitHub (design decision 8): Settings, Rules, Rulesets, New branch ruleset; name `master requires tests`; enforcement Active; target the default branch; enable "Require a pull request before merging" and "Require status checks to pass" with the `test` check; bypass list: Repository admin. Verify `GET /repos/toddseller/MMDb/rules/branches/master` lists both rules
- [ ] 9.2 Open a throwaway pull request whose only commit makes one example fail; verify the `test` check fails and GitHub blocks the merge, then close the pull request and delete its branch
- [ ] 9.3 Merge the `add-ci-test-gate` pull request with its passing check; verify the `test` run for the merge commit on `master` passes

## Workflow follow-up

- No deploy is needed: the change touches only tests, CI and docs, and the server's `git pull` picks the files up with the next deploy.
- Archive the change with `/opsx:archive` after 9.3.
- Next change: `secure-api-tokens-and-webhook`.
