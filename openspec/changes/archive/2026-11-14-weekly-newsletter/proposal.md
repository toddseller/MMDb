# Proposal

## Why

Tautulli emails a "recently added" newsletter every Sunday, but its template can barely be restyled and its branding can't be removed. Readers also can't unsubscribe or open an issue in a browser. MMDb already holds the Tautulli and TMDB keys and has a deploy pipeline, so it can send a Myflix-branded newsletter instead.

## What Changes

- A new Node job in MMDb, `newsletter/`, runs once a week as its own compose service and then exits. The Ruby app does not change.
- The job reads the last 7 days of additions to the movie and TV libraries from Tautulli. It groups episodes, seasons and new shows into one card per show and gives each movie its own card. Each card gets a TMDB poster and a link that opens the title in Plex.
- The issue is written with React Email and sent as a Resend Broadcast from `MYFLIX Newsletter <info@myflix.stream>` to a Resend segment. Resend sends one email per reader, hosts the unsubscribe page and skips readers who have unsubscribed.
- Each issue is also saved as a web page at `https://myflix.stream/newsletter/<date>-<random>.html`, and the email links to it under "View in browser". The page is written to a host folder that the myflix nginx container serves read-only. That mount is one line in the myflix repo and ships as its own small PR.
- Issues rotate between templates, so the same template isn't sent two weeks in a row once there are two or more. A holiday window switches to that holiday's templates automatically; v1 ships one regular template and a Christmas template for December 1 to 26.
- No email is sent in a week with no additions.
- A systemd timer on onyx runs the job every Sunday at 00:00 Pacific time, in both standard and daylight time. Its unit files live in the repo. The job also runs on Pacific time, so holiday windows and issue dates follow the Pacific calendar. Tautulli's newsletter is turned off after the first good send.
- The required CI check also builds the newsletter image and runs its type-check and unit tests.

## Capabilities

### New Capabilities
- `weekly-newsletter`: what the weekly email contains, who receives it, how readers unsubscribe, the browser copy of each issue, and when the email is sent or skipped.

### Modified Capabilities
- `ci-test-gate`: the required check also builds the newsletter image and runs the newsletter's type-check and unit tests.

## Impact

- **New code:** `newsletter/`, with its own `package.json`, `Dockerfile` (a `node:24-slim` image pinned by digest), source and tests. New dependencies: `@react-email/components`, `react`, `resend` and `tsx`. Dev dependencies: `react-email` for the preview server, `typescript` and React types.
- **`docker-compose.yml`:** a `newsletter` service under a compose profile, so `compose up` never starts it. It reads `.env` and mounts `newsletter/issues/`.
- **`.env` (server):** new `RESEND_API_KEY` (Full access; a Sending access key can't create broadcasts) and `RESEND_SEGMENT_ID`. It reuses `TAUTULLI_KEY` and `TMDB_TOKEN`.
- **CI:** `.github/workflows/test.yml` builds the newsletter image and runs its checks; `.github/dependabot.yml` watches `newsletter/` for npm and Docker updates.
- **`bin/deploy` is unchanged.** The timer runs `docker compose run --rm --build newsletter`, so each run builds the current code.
- **Docs:** `DOCKER_DEPLOYMENT.md` and the README describe the service, installing the timer, the shared issues folder and the new keys.
- **Outside this repo:** a one-line volume in myflix's `docker-compose.yml`; the Resend segment seeded with the 8 current Tautulli recipients; Tautulli's newsletter turned off.
