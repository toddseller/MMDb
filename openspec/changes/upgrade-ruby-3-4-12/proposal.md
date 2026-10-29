# Proposal

## Why

MMDb runs Ruby 3.4.8, four patch releases behind the current 3.4.12, so production and the Docker images miss the bug and security fixes in 3.4.9 to 3.4.12. Ruby 3.4 itself is supported until March 2028, so a patch bump is all that's needed. CI is also held on the `ubuntu-24.04` runner image only because `setup-ruby` never published a 3.4.8 build for Ubuntu 26.04; it has one for 3.4.12.

## What Changes

- Ruby 3.4.8 becomes 3.4.12 everywhere it is pinned: `Gemfile`, `Gemfile.lock`, both Dockerfiles, and CI.
- Both workflows, `test.yml` and `deploy.yml`, go back from the `ubuntu-24.04` pin to `ubuntu-latest`, which is Ubuntu 26.04 today. The pin existed only because 3.4.8 had no 26.04 build; following GitHub's current image keeps CI from sitting on an old one.
- The README and `DOCKER_DEPLOYMENT.md` name 3.4.12.
- No gem or app code changes. Ruby 4.0, ActiveRecord 8.1 and the PostgreSQL upgrade are separate work.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The app's behavior does not change, so this change has no spec deltas (`skip_specs: true`).

## Impact

- Production: `Gemfile.lock` and both Dockerfiles change, so the deploy rebuilds the web image from `ruby:3.4.12`, which also brings the base image's latest Debian 13 packages.
- CI: the test and deploy jobs run on `ubuntu-latest`. The explicit `ubuntu-26.04` label was ruled out because actionlint, which the `test` job runs, doesn't know it in any release yet. When GitHub next moves `ubuntu-latest`, CI fails at Ruby setup if the pinned Ruby has no build for the new image, as 3.4.8 did on 2026-10-25; keeping Ruby current is what avoids that. `deploy.yml` only runs on a tag, so its first run on 26.04 is the first deploy after this change; it only installs `cloudflared` from its `.deb` and runs `ssh`, both of which work the same on 26.04.
- Local development: Ruby 3.4.12 is installed next to 3.4.8 with `ruby-install`, and the gitignored `.ruby-version` changes so chruby picks it.
