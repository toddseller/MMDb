# Tasks

## 0. Branch

- [x] 0.1 Create `run-as-production` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Malformed webhook URLs get a 400

- [x] 1.1 In `spec/plex_webhook_spec.rb`, add an example that posts to `/v1/webhooks/new?token=%zz` and expects a 400 whose body does not include `.rb:` and with nothing added. Run `bundle exec rspec spec/plex_webhook_spec.rb` and see it fail because `Rack::QueryParser::InvalidParameterError` escapes the app.
- [x] 1.2 In `config.ru`'s `WebhookToken#call`, rescue `Rack::QueryParser::InvalidParameterError` from the parse and return a 400 with Sinatra's "Invalid query parameters" wording, as in design.md. Verify that 1.1 and the rest of `spec/plex_webhook_spec.rb` pass.

## 2. Production keeps its logs and temp-file cleanup

- [x] 2.1 In `spec/origin_security_spec.rb`, add an example that sets `ENV['RACK_ENV']` to `production` for its duration (restoring it afterwards), loads `config/puma.rb` with `Puma::Configuration.new(config_files: ['config/puma.rb'])` and `clamp`, and expects `options[:redirect_stdout]` to be nil. Run the file and see it fail on `log/puma_stdout.log`.
- [x] 2.2 Delete the `stdout_redirect` block and its comment from `config/puma.rb`. Verify that 2.1 passes.
- [x] 2.3 Add `use Rack::TempfileReaper` to `config.ru` before `use WebhookToken`, with a one-line comment on why (rackup adds it only in development). Verify that `spec/artwork_upload_spec.rb` and `spec/plex_webhook_spec.rb` pass.

## 3. The environment comes from each machine's `.env`

- [x] 3.1 In `spec/origin_security_spec.rb`, add an example that loads `docker-compose.yml` and expects the `web` service's `environment` to include `RACK_ENV=${RACK_ENV:-development}`. Run it and see it fail on `RACK_ENV=development`.
- [x] 3.2 Change the entry in `docker-compose.yml` to `RACK_ENV=${RACK_ENV:-development}`, and say in `DOCKER_DEPLOYMENT.md`'s development section that `RACK_ENV` comes from `.env` and defaults to development. Verify that 3.1 passes and that `docker compose config` locally shows `RACK_ENV: development`.
- [x] 3.3 Rewrite the comments at `config.ru` (above `set :show_exceptions, false`) and `app/helpers/session_helper.rb:44` so they no longer say production runs as development: the first now keeps local development's errors out of the browser, the second explains the per-request `secure` flag without that claim. Verify with `grep -rn "RACK_ENV=development" app config config.ru` that only intended mentions remain.

## 4. Verify

- [x] 4.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Before tagging, ask the owner to confirm, then change `RACK_ENV=development` to `RACK_ENV=production` in the server's `~/MMDb/.env` (Migration Plan step 1 in design.md).
- Commit on `run-as-production`, archive the change in the same PR and open it with `gh`; the owner merges.
- After the deploy, run the Migration Plan's step 3 checks in design.md.
