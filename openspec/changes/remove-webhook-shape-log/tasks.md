# Tasks

Test-first: change the test, see it fail for the right reason, make the smallest change that passes, then run the whole suite. Work on the branch `remove-webhook-shape-log`.

## 1. Remove the shape line

- [x] 1.1 Replace the shape-log examples in `spec/plex_webhook_spec.rb` with one example that an authenticated webhook (text field, file part and JSON body) writes no `plex webhook:` line; run it and see it fail because the line is still written
- [x] 1.2 Remove `log_plex_shape` and its call from `app/controllers/webhooks_controller.rb`; verify 1.1 and the whole suite pass

## 2. Pull request with its archive

- [x] 2.1 Commit, push the branch, and open the pull request with `gh`; verify the `test` check passes
- [x] 2.2 Archive the change as the last commit (remove the requirement from `openspec/specs/plex-webhook/spec.md`, keeping its other requirements and Purpose untouched, then move the change to the archive), push, and verify the `test` check passes

## Workflow follow-up

- After the owner merges: on the server, `cd ~/MMDb && git pull --ff-only && docker compose restart web`, then confirm the next Plex webhook gets a 204 with no `plex webhook:` line.
