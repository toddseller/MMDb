# Tasks

## 1. Deploy script (test-first)

- [x] 1.1 Add `spec/deploy_script_spec.rb` with a harness that builds a throwaway origin repository and a clone in a temp dir, copies `bin/deploy` in, and puts recording stand-ins for `docker` and `curl` first on `PATH`. Add examples for request validation (a missing or wrong verb, malformed tags such as `v1; rm -rf ~`, and the `SSH_ORIGINAL_COMMAND` form), each expecting exit 2 and no git or docker calls. Show them failing, then add `bin/deploy` (executable, everything in `main`, called on the last line) until they pass
- [x] 1.2 Add examples for the git checks: a dirty tracked file, a branch other than `master`, a tag not on `origin/master`, and a tag behind `HEAD` all exit non-zero and leave `HEAD` and the app untouched; a tag ahead fast-forwards `master`; a tag equal to `HEAD` redeploys without moving it. Show them failing, then implement steps 2 and 3 of the design until they pass
- [x] 1.3 Add examples that a code-only change runs `docker compose restart web`, and that changes to `Gemfile.lock`, a `Dockerfile` or a compose file run `docker compose up -d --build`. Show them failing, then implement step 4 until they pass
- [x] 1.4 Add examples that the health check passes on a 200, fails after its tries on a 502 with a non-zero exit, and that the output names the tag, old and new commits, and the action taken. Show them failing, then implement step 5 until they pass, and run the whole suite

## 2. Workflow

- [x] 2.1 Add `.github/workflows/deploy.yml` as in the design (trigger on `v*` tags, `production` environment, single concurrency group, least permissions, the format check, the on-`master` check, the `test` check-run check, then cloudflared and ssh with the pinned host key). Verify it with `actionlint` run locally through its Docker image
- [x] 2.2 Add an `actionlint` step to the `test` job in `.github/workflows/test.yml`, so a broken workflow fails CI. Verify the job still passes locally with the same command

## 3. Setup guide

- [x] 3.1 Add a "Deploying" section to `README.md` covering how to deploy (tag and push), how to redeploy, how to roll back, and the one-time setup: the Cloudflare route, Access app and service token; the server key line; and the GitHub environment, secrets and tag ruleset. It includes the exact commands for generating the key and reading the host key, and never prints secret values. Verify every command in it against the design

## 4. Integration

- [x] 4.1 Run the whole suite and `openspec validate automate-mmdb-deploy --strict`, and verify both pass

## Workflow follow-up

- Archive the change as the last commit of the change's PR, and open the PR with `gh`. The description links the README setup section.
- After merge: pull by hand on the server so `bin/deploy` exists, then do the one-time setup from the README.
- First deploy: tag the merge commit and push the tag. The run redeploys, restarting and checking the site; watch it pass. The next merged change is the first fast-forward deploy.
