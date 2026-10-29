# Docker Deployment Guide

## Overview

This project runs in Docker with Ruby 3.4, locally and on the production server, which deploys it with `bin/deploy` (see the README's Deployment section).

## File Structure

- `Dockerfile` - The Docker image, used locally and in production
- `docker-compose.yml` - The web service, with the code mounted for live reloading
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

## Monitoring

Health check endpoint is built-in:
```bash
curl http://localhost:4666/
```
