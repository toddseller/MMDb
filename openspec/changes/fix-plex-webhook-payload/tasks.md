# Tasks

Test-first throughout: write the test, run it and see it fail for the right reason, then write the smallest code that passes, then run the whole suite. Work on the branch `fix-plex-webhook-payload`.

## 1. Branch and test helper

- [x] 1.1 Create the branch `fix-plex-webhook-payload` from `master`; verify `git status -sb` shows it
- [x] 1.2 Add a `once:` option to `spec/support/request.rb` that sends the body through an input with `read` and no `rewind` (design decision 4); verify by changing the existing JSON-body webhook example to use it and seeing it fail with a 500, as production does

## 2. Every payload form (spec: The webhook reads the event in any form Plex sends; An unreadable event is rejected without importing)

- [x] 2.1 Extend `spec/plex_webhook_spec.rb`: a hand-built multipart body whose `payload` part has a filename and `Content-Type: application/json` imports the show; invalid JSON in `payload` and a request with no event both answer 400 and import nothing. Run them and see the file-part and invalid-JSON examples fail with 500
- [x] 2.2 Replace the parsing in `webhooks_controller.rb` with a `plex_event` helper (design decision 1); verify all webhook examples, including the read-once JSON body, pass and the whole suite passes

## 3. Shape log (spec: Each webhook request's shape is logged without values)

- [x] 3.1 Add examples capturing stdout: an authenticated request logs one line naming the content type, the parameter names and `payload=file(application/json)` or `payload=text`, and the line contains neither the event JSON nor the secret. Run them and see them fail
- [x] 3.2 Write the shape line before parsing (design decision 2); verify 3.1 and the whole suite pass

## 4. Secret out of logs (spec: The webhook secret never appears in logs)

- [x] 4.1 Add an example that wraps the test app in `Rack::CommonLogger` with a `StringIO` logger, sends a webhook with the correct token and one with a wrong token, closes each body, and checks that the log contains `/v1/webhooks/new` and neither token. Run it and see it fail
- [x] 4.2 Add the `WebhookToken` middleware in `config.ru` and read the secret from `env['mmdb.webhook_token']` in the `before` filter (design decision 3); verify 4.1, all webhook examples and the whole suite pass

## 5. Pull request with its archive

- [ ] 5.1 Commit, push the branch, and have the owner open the pull request; verify the `test` check passes
- [ ] 5.2 Archive the change on the branch as its last commit (merge the four ADDED requirements into `openspec/specs/plex-webhook/spec.md`, keeping its existing requirements and Purpose untouched, then move the change to `openspec/changes/archive/`), push, and verify the `test` check passes on that commit

## Workflow follow-up

These run after the owner merges the pull request:

- Deploy: `cd ~/MMDb && git pull --ff-only && docker compose up -d --build`.
- The owner triggers a Plex import (add something new to the library).
- Verify in `docker logs mmdb-web-1`: the shape line for that request, a 204, the item in MMDb, and no `token=` in any access line.
- Record which shape Plex sent in the follow-up notes; once known, a later change can drop the shape line.
