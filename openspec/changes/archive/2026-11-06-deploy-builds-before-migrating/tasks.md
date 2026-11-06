# Tasks

Each code task is test-first: change the spec, run it and see it fail for the right reason, then write the smallest code that passes and run the whole suite (`bundle exec rspec`). Tasks marked **(owner)** are done by the owner, with a walkthrough.

## 1. Build, migrate from the new image, recreate

- [x] 1.1 Teach the fake `docker` in `spec/deploy_script_spec.rb` to fail `compose build` on `FAKE_BUILD_FAILS` and `compose run` on `FAKE_MIGRATE_FAILS`, and move the open-input check from `exec` to `run`; change every expected sequence to `compose build web`, `compose run --rm -T web bundle exec rake db:migrate`, `compose up -d --force-recreate web` (code only, redeploy, each of the four image files) and drop "rebuild" from the output test; verify they fail against today's script
- [x] 1.2 Add examples: a failed build stops after `compose build web` with no migration and no curl; a failed migration stops after the build and the migration, and the redeploy runs all three; a `Gemfile.lock` deploy retried as a redeploy builds again; verify they fail against today's script
- [x] 1.3 Change `bin/deploy` to build, migrate with `run --rm`, then `up -d --force-recreate web`, removing the diff and both branches, and update its comments; verify `spec/deploy_script_spec.rb` and the whole suite pass

## 2. Release

- [ ] 2.1 **(owner)** Release this change on its own tag, with no gem, Dockerfile or compose change in it; verify the Deploy run is green and mmdb.online answers 200
- [ ] 2.2 **(owner)** Deploy the next release that changes `Gemfile.lock` (a Dependabot gem bump); verify the Deploy log shows the build installing the new gems before the migration, and the run is green with no manual step

## Workflow follow-up

- Run `ponytail:ponytail-review` on the uncommitted diff and fix the findings you choose, test-first.
- Commit the code, then archive this change with spec sync as a second commit, `Archive deploy-builds-before-migrating`, on the same branch, before opening the PR. A fix found after that goes on top as a new commit.
