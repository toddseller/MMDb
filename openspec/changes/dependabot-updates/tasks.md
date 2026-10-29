# Tasks

## 0. Branch

- [x] 0.1 Create `dependabot-updates` from a freshly fetched `origin/master`, and check with `git status` that you're on that branch and this change's artifacts came along.

## 1. Remove the unused production setup

- [x] 1.1 Delete `Dockerfile.production` and `docker-compose.production.yml`. Drop both names from the file list in `spec/deploy_script_spec.rb`'s rebuild examples. Verify that `bundle exec rspec spec/deploy_script_spec.rb` passes.
- [x] 1.2 Remove from `README.md`: the `Dockerfile.production` tree entry, "Option 4: Docker Compose (Production)" (renumbering the options after it), "Docker Production Deployment", and the production compose commands under Troubleshooting and Health Checks. From `DOCKER_DEPLOYMENT.md`, remove the production, container management, scaling, troubleshooting, backup and updating sections and the two file-list entries, keeping development setup and environment variables. Verify `git grep -nE "Dockerfile\.production|docker-compose\.production" -- ':!openspec'` finds nothing.

## 2. The Docker image decides the Ruby patch version

- [x] 2.1 Create `spec/dependency_updates_spec.rb` with failing examples: the `FROM` line of `Dockerfile` names `ruby:<version>@sha256:<64 hex>`; `Bundler.definition.ruby_version` accepts both the Dockerfile's Ruby version and the next patch release after it. Run `bundle exec rspec spec/dependency_updates_spec.rb` and see the digest example fail on the bare tag and the requirement example fail on the next patch.
- [x] 2.2 Pin `Dockerfile` to `FROM ruby:3.4.12@sha256:<digest>`, taking the multi-platform index digest from `docker buildx imagetools inspect ruby:3.4.12`. Change `Gemfile` to `ruby '~> 3.4.0'` and run `bundle install`, keeping `Gemfile.lock`'s gems unchanged. Verify that 2.1 passes, and that `docker build -t mmdb-digest-check .` builds and `docker run --rm mmdb-digest-check ruby -v` prints 3.4.12.

## 3. CI builds the image and tests the newest 3.4

- [x] 3.1 In `spec/dependency_updates_spec.rb`, add a failing example: `.github/workflows/test.yml`'s `test` job has a step whose `run` starts with `docker build`. Run it and see it fail.
- [x] 3.2 In `test.yml`, set `ruby-version: '3.4'` and add a `docker build .` step after checkout and before the test steps, with a one-line comment that it catches an image that wouldn't build before the deploy does. Verify that 3.1 passes and that `docker run --rm -v "$PWD:/repo:ro" -w /repo rhysd/actionlint:1.7.7 -no-color` lints clean.

## 4. Dependabot

- [x] 4.1 Add `.github/dependabot.yml` with version 2 and four weekly entries at `/`: `bundler`, `npm`, `github-actions` and `docker`. Each has a group covering `minor` and `patch` update types; the `docker` entry also ignores `version-update:semver-minor` and `version-update:semver-major` for `ruby`, as in design.md. Verify the file parses with `ruby -ryaml -e 'YAML.load_file(".github/dependabot.yml")'`, and that every `package-ecosystem` value is one of GitHub's documented names.

## 5. Verify

- [x] 5.1 Run `bundle exec rspec`, `npm test`, `npm run typecheck` and `npm run test:e2e`, and verify they all pass.

## Workflow follow-up

- Run the ponytail review on the uncommitted diff, report its findings and wait for the owner to pick fixes before the first commit.
- Commit on `dependabot-updates`, archive the change in the same PR and open it with `gh`; check that the PR's `test` job builds the image and passes. The owner merges.
- After merging: check the repository's Dependabot page for configuration errors, and ask the owner to turn on Dependabot security updates under Settings, Code security.
