# Proposal

## Why

v2026.11.06.0 (Dependabot's gem bumps plus the avatar endpoint) failed to deploy. `bin/deploy` runs migrations in the *running* container, which already sees the new `Gemfile.lock` through its mount but has the old gems installed, so Bundler stopped with `GemNotFound` before any migration ran. Retrying could not fix it: once the server is on the tag, the old and new commits are the same, the "did gems change" diff is empty, and the script only ever restarts. The release went live only after a manual `docker compose up -d --build` on the server. Every Dependabot gem update will hit this.

## What Changes

- Every deploy builds the image first. A failed build stops the deploy with the running app untouched.
- Migrations run in a throwaway container from the newly built image, so they always load the gems the release locks.
- The web container is then recreated from that image on every deploy, instead of either restarting it or rebuilding it depending on which files changed. **BREAKING** (for the owner only): a deploy no longer distinguishes "code only" from "rebuild", and its log no longer says which.
- A redeploy of the tag the server is already on builds, migrates and recreates like any other deploy, so retrying a failed gem update now works.

Out of scope: pruning old images, and changing the GitHub workflow or the health check.

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `deploy-on-tag`: the rebuild-only-when-gems-changed requirement is replaced by building on every deploy; migrations run from the new image instead of the running container; a redeploy recreates the container rather than restarting it.

## Impact

- `bin/deploy`: the migrate and restart/rebuild steps.
- `spec/deploy_script_spec.rb`: the fake `docker` and the expected call sequences.
- Server: every deploy now takes a cached `docker build` (seconds when the Gemfile didn't change) and leaves the previous image dangling.
- The first deploy after merging runs the script the server already has (bash reads it before the merge rewrites it), so it must not also carry a gem change.
