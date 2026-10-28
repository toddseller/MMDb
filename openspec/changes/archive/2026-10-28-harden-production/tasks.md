# Tasks

## 0. Branch

- [x] 0.1 Create `harden-production` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Error pages hide the app's internals

- [x] 1.1 Create `spec/origin_security_spec.rb` with an example that sets Sinatra's `environment` to `:development` for its duration (restoring it afterwards) and asserts `Sinatra::Application.show_exceptions?` is false. Run `bundle exec rspec spec/origin_security_spec.rb` and see it fail because the default turns the exception page on in development.
- [x] 1.2 Add `set :show_exceptions, false` to the `configure` block in `config.ru`, as in design.md. Verify that 1.1 passes.

## 2. The server needs its signing secrets

- [x] 2.1 Add a fixed `SESSION_SECRET` of at least 64 bytes to `spec/support/test_env.rb`, and extend `spec/settings_spec.rb`'s first example to check it with `expect_test_value`. Run `bundle exec rspec spec/settings_spec.rb` and verify it passes.
- [x] 2.2 In `spec/origin_security_spec.rb`, add examples that spawn `ruby -e "require './config/environment'"` from the app root with `Open3`: with `SESSION_SECRET` set to `''` the process exits non-zero and its output names `SESSION_SECRET`; the same for `JWT_SECRET`; with both set to test values it exits zero. Run the file and see the two missing-secret examples fail because the app loads anyway.
- [x] 2.3 Right after `Dotenv.load` in `config/environment.rb`, `abort` with the variable's name when `SESSION_SECRET` or `JWT_SECRET` is blank, and remove the fallback secret from `config.ru`. Verify that 2.2 passes.

## 3. The web port is published on loopback only

- [x] 3.1 In `spec/origin_security_spec.rb`, add an example that loads `docker-compose.yml` with `YAML.safe_load_file` and asserts the `web` service's `ports` is exactly `["127.0.0.1:4666:4666"]`. Run it and see it fail on the current `"4666:4666"`.
- [x] 3.2 Change the port in `docker-compose.yml` to `"127.0.0.1:4666:4666"`, and add to `DOCKER_DEPLOYMENT.md`'s development section that the port is published on localhost only, so other machines can't reach it. Verify that 3.1 passes.

## 4. Verify

- [x] 4.1 Run `bundle exec rspec`, `npm test` and `npm run test:e2e`, and verify they all pass, especially `spec/settings_spec.rb`, `spec/api_auth_spec.rb` and `spec/session_expiry_spec.rb`.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `harden-production`, archive the change in the same PR and open it with `gh`; the owner merges.
- After the deploy, check the Migration Plan's step 2 in design.md: mmdb.online loads, `/users/999999999` shows no stack trace, and port 4666 on the server's LAN address is refused from another machine.
