# Docker Deployment Guide

## Overview

This project runs in Docker with Ruby 3.4, locally and on the production server, which deploys it with `bin/deploy` (see the README's Deployment section).

## File Structure

- `Dockerfile` - The Docker image, used locally and in production
- `docker-compose.yml` - The web service, with the code mounted for live reloading, and the weekly `newsletter` job
- `newsletter/` - The newsletter job's Node code, `Dockerfile` and systemd timer
- `config/puma.rb` - Puma web server configuration
- `.dockerignore` - Files to exclude from Docker builds
- `.env.example` - Template for environment variables

## Development Setup

### Quick Start

```bash
# Start development environment
docker compose up

# Or run in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

The application will be available at `http://localhost:4666`. The port is published on localhost only, so other machines on the network can't reach it; on the server, the Cloudflare tunnel reaches the container over the Docker network at `http://web:4666`.

### Features
- Live code reloading (volume mounted)
- `RACK_ENV` comes from `.env` and defaults to `development`; the production server's `.env` sets `production`
- Direct rackup server
- Source code synced to container

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@db-host:5432/mmdb` |
| `SESSION_SECRET` | Session encryption key (≥64 chars) | Generated secure random string |
| `JWT_SECRET` | API token signing key | Generated secure random string |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_CONCURRENCY` | `2` | Number of Puma workers |
| `PUMA_THREADS` | `5` | Threads per worker |
| `PORT` | `4666` | Application port |
| `PGPASS_FILE` | none | Host path of a `.pgpass` file (mode 600) with the database password; the web container reads it when `DATABASE_URL` has no password |

### API Keys

Configure these based on your external service accounts:
- `TAUTULLI_KEY`
- `TMDB_TOKEN`
- `RESEND_API_KEY` and `RESEND_SEGMENT_ID`, for the weekly newsletter only (see below)

## Generating a Secure Session Secret

```bash
# Generate a 64-byte random secret
ruby -e "require 'securerandom'; puts SecureRandom.hex(64)"
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Keep images updated** - Dependabot proposes base image and dependency updates each week
3. **Use strong secrets** - Generate random `SESSION_SECRET` and `JWT_SECRET` values

## Performance Tuning

### Adjust Puma Workers
```bash
# In .env file
WEB_CONCURRENCY=4  # Increase for more CPU cores
PUMA_THREADS=5     # Adjust based on workload
```

### Database Connection Pool
Ensure ActiveRecord pool size matches Puma threads in `config/database.rb`:
```ruby
pool: ENV.fetch('DB_POOL', 5).to_i
```

## Weekly newsletter

Every Sunday at midnight Pacific, the `newsletter` service emails the week's Plex additions through Resend and saves a browser copy of the issue that myflix.stream serves at `/newsletter/<date>-<random>.html`. It runs once and exits. The `newsletter` compose profile keeps `docker compose up` from starting it, and `bin/deploy` doesn't build it: each run builds the image from the checked-out code.

**Settings** (the server's `.env`): `TAUTULLI_KEY` and `TMDB_TOKEN`, shared with the web app, plus:

| Variable | What it is |
|----------|------------|
| `RESEND_API_KEY` | A Resend key with "Full access": Resend refuses to create a broadcast with a "Sending access" key ("This API key is restricted to only send emails"). |
| `RESEND_SEGMENT_ID` | The Resend segment whose contacts receive the issue. Readers who unsubscribe stay in it and are skipped. |

The job runs on Pacific time (`TZ` in `docker-compose.yml`), so issue dates and the Christmas window (Dec 1 to 26) follow the Pacific calendar although the server runs on UTC.

**Issue pages** go to `~/MMDb/newsletter/issues/` (gitignored). myflix's compose file mounts that folder read-only into its nginx, so the two apps share this host path. Create it before either container first starts, or Docker creates it owned by root and the job can't write to it:

```bash
mkdir -p ~/MMDb/newsletter/issues
```

**The timer.** A systemd user timer (the `onyx` user has lingering on, so it runs without a login) starts the job. Install it once:

```bash
systemctl --user link ~/MMDb/newsletter/systemd/mmdb-newsletter.service ~/MMDb/newsletter/systemd/mmdb-newsletter.timer
systemctl --user enable --now mmdb-newsletter.timer
```

Day to day:

```bash
systemctl --user list-timers mmdb-newsletter.timer   # when it runs next
journalctl --user -u mmdb-newsletter -n 50          # what the last run printed
systemctl --user start mmdb-newsletter.service      # send this week's issue now
systemctl --user daemon-reload                      # after a pull that changed the unit files
```

**A test send** goes to another segment (for example, one holding only you) without touching the live list:

```bash
cd ~/MMDb && docker compose run --rm --build -e RESEND_SEGMENT_ID=<test segment id> newsletter
```

**Templates** live in `newsletter/src/emails/`. `newsletter/src/templates.ts` lists the regular templates, which rotate weekly, and the holiday windows, which take over on their dates. To see them with sample data:

```bash
cd newsletter && npm ci && npm run preview   # React Email's preview server
```

## Monitoring

Health check endpoint is built-in:
```bash
curl http://localhost:4666/
```
