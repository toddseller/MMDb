# Proposal

## Why

Every MMDb deploy is done by hand over SSH from the LAN: pull, then decide between `docker compose restart web` and `up -d --build`, and remember to recreate the container after `.env` changes. It is easy to deploy a commit that hasn't passed CI, to pick the wrong command, or to forget a step, and the server is only reachable from the local network, so GitHub can't deploy it today.

## What Changes

- Pushing a `v*` tag (for example `v2026.10.23`) to `toddseller/MMDb` runs a new `Deploy` workflow.
- The workflow refuses to deploy unless the tag's commit is on `master` and its `test` check passed, and runs one deploy at a time.
- It reaches the server over SSH through the existing `mmdb-tunnel` Cloudflare tunnel, behind Cloudflare Access with a service token, using a dedicated key that can only run the deploy script.
- A deploy script in the repo (`bin/deploy`) fast-forwards the server's `master` to the tag, rebuilds the container when the image or compose files changed and restarts it otherwise, then checks that mmdb.online answers. Any failure fails the workflow run.
- The script repeats the safety checks on the server (tag format, tag on `master`, fast-forward only), so the key can't deploy anything else even if the GitHub secrets leak.
- A tag ruleset limits who can create `v*` tags and stops them being moved or deleted.
- Manual deploys keep working; the server's checkout stays on `master` tracking `origin/master`.

Out of scope: myflix (a follow-up with its own script), rollback by tagging an older commit (rollbacks are reverts on `master`, then a new tag), and changes to `.env`, which stays a manual step.

## Capabilities

### New Capabilities
- `deploy-on-tag`: how a tagged MMDb release reaches production: what triggers a deploy, which commits may be deployed, how the server is reached and what the server-side script does, and how a failed deploy is reported.

### Modified Capabilities

None. `ci-test-gate` is unchanged; the deploy only reads the result of its `test` check.

## Impact

- `.gitignore`: `bin/` was ignored entirely (it held Bundler binstubs), so it now ignores the folder's contents except `bin/deploy`.
- `.github/workflows/test.yml`: an `actionlint` step, so a broken workflow fails CI.
- New: `.github/workflows/deploy.yml`, `bin/deploy`, and `spec/deploy_script_spec.rb` (which runs the script against throwaway git repositories with stand-ins for `docker` and `curl`).
- Server: one more line in `~/.ssh/authorized_keys` for the deploy key, restricted to `bin/deploy`.
- Cloudflare (set up by the owner): an SSH route on `mmdb-tunnel`, an Access application and a service token.
- GitHub (set up by the owner): a `production` environment with four secrets and a known-hosts value, and a ruleset for `v*` tags.
