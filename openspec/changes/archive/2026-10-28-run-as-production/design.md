# Design

## Context

- The server runs `rackup config.ru` in the dev image through `docker-compose.yml`, which hard-codes `RACK_ENV=development`. A hard-coded `environment:` entry wins over `env_file`, so the `RACK_ENV` line in the server's `.env` is ignored today. Compose fills `${...}` from the project's `.env`; both the server's and the local `.env` currently say `development`.
- Puma loads `config/puma.rb` by default. Its production branch redirects stdout and stderr to `log/puma_*.log`, which on the server is the mounted `~/MMDb/log/`. Its worker count is pinned by `WEB_CONCURRENCY=0` and its threads by `PUMA_THREADS=1`, both in the server's `.env`, so neither changes with the environment.
- Puma answers an error that escapes the app with the backtrace only when its environment is `development` or `test`; otherwise with a 500 and an empty body.
- rackup adds default middleware only for `development` (ContentLength, its access logger, ShowExceptions, Lint, TempfileReaper) and `deployment`; `production` gets none. `Sinatra::Application` enables its own request logger outside `test`, and that one skips itself when rackup's is present, so request logging continues with the same line format.
- `WebhookToken` calls `Rack::Utils.parse_query` on `/v1/webhooks` requests before Sinatra runs; a malformed escape raises `Rack::QueryParser::InvalidParameterError` straight to Puma. Sinatra already turns the same error into a 400 ("Invalid query parameters: ...") on its own routes.

## Goals / Non-Goals

**Goals:**
- Production runs as `production`; local Docker and the test suites keep their environments.
- No error on any path reaches a visitor with a backtrace (specs/origin-security), and malformed webhook URLs get a 400 (specs/plex-webhook).

**Non-Goals:**
- Changing `PUMA_THREADS`, `WEB_CONCURRENCY` or the Docker image. The dev image stays; `Dockerfile.production` and `docker-compose.production.yml` stay unused.
- Removing `set :show_exceptions, false`: it still governs local development.

## Decisions

**`RACK_ENV=${RACK_ENV:-development}` in `docker-compose.yml`, and `RACK_ENV=production` in the server's `.env`.** The environment becomes a per-machine setting kept where the other per-machine settings already live. Rejected: hard-coding `production` in compose (local Docker would run as production); a separate compose file for the server (`bin/deploy` and the tunnel's network would have to follow it).

**Delete the `stdout_redirect` block from `config/puma.rb`.** `docker logs` is where the server's logs are read, and the redirected files would grow unrotated in the checkout. Rejected: pointing `PUMA_STDOUT_LOG` at `/dev/stdout` (configuration to undo a branch nothing wants).

**Add `use Rack::TempfileReaper` in `config.ru`.** It keeps today's behaviour of deleting multipart upload temp files (artwork, Plex payloads with a thumbnail) at the end of each request instead of whenever garbage collection runs. In development rackup also adds it, and a second copy only deletes files that are already gone.

**`WebhookToken` rescues `Rack::QueryParser::InvalidParameterError` and answers 400 with Sinatra's wording.** The response matches what Sinatra already returns for other routes, and the fix sits where the parse happens. Because the rejection happens before Sinatra, the request isn't written to the access log, so its query string (which could hold the token) never reaches a log either. Rejected: a Puma `lowlevel_error_handler` (it would hide the bug rather than answer the request correctly, and production's empty-body 500 already covers anything else).

**Tests.**
- Webhook: `post('/v1/webhooks/new?token=%zz')` through the full `config.ru` app expects a 400 whose body has no backtrace. Today the exception escapes `RequestHelper`, which fails the example for the right reason.
- Compose: the `web` service's `environment` contains `RACK_ENV=${RACK_ENV:-development}`.
- Puma: with `RACK_ENV` set to `production` for the example, `Puma::Configuration.new(config_files: ['config/puma.rb'])` after `clamp` has no `redirect_stdout`. Today it is `log/puma_stdout.log`.
- TempfileReaper: `RequestHelper::APP`'s middleware stack is not inspectable without reaching into internals, so it is covered by the existing artwork and webhook upload specs still passing, plus the post-deploy log check. No dedicated test.

## Risks / Trade-offs

- [The server's `.env` isn't changed, so the deploy leaves production in development] → The `.env` edit is a task before the tag, and the post-deploy check reads Puma's `Environment:` line.
- [Something only worked because of development mode] → Searched: the only environment checks are the reloader, SQL logging and the database-name fallback (`DATABASE_URL` is set on the server). Lint and ContentLength only check or restate what Puma already does.
- [Losing SQL logs makes a production issue harder to trace] → Backtraces are still logged; SQL logging can be turned back on temporarily by running a container as development.

## Migration Plan

1. On the server, change `RACK_ENV=development` to `RACK_ENV=production` in `~/MMDb/.env`. Nothing reads it until the new compose file is deployed.
2. Merge and tag. The compose change makes `bin/deploy` run `docker compose up -d --build`.
3. Verify: Puma's startup line says `Environment: production`; `docker logs mmdb-web-1` shows request lines and no SQL; `https://mmdb.online/v1/webhooks/new?token=%zz` returns a 400 with no backtrace; `https://mmdb.online/users/999999999` still returns a bare 500.
4. Rollback: set the server's `.env` back to `development` and run `docker compose up -d`. No code rollback is needed.
