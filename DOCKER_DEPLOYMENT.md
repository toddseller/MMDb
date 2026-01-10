# Docker Deployment Guide

## Overview

This project includes both development and production Docker configurations for Ruby 3.4.8.

## File Structure

- `Dockerfile` - Development Docker image
- `Dockerfile.production` - Production-optimized multi-stage Docker image
- `docker-compose.yml` - Development environment with live code reloading
- `docker-compose.production.yml` - Production environment with PostgreSQL
- `config/puma.rb` - Puma web server configuration for production
- `.dockerignore` - Files to exclude from Docker builds
- `.env.example` - Template for environment variables

## Development Setup

### Quick Start

```bash
# Start development environment
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

The application will be available at `http://localhost:4666`

### Features
- Live code reloading (volume mounted)
- Development environment (`RACK_ENV=development`)
- Direct rackup server
- Source code synced to container

## Production Deployment

### Prerequisites

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` and configure all required variables:
   - Set a strong `SESSION_SECRET` (minimum 64 characters)
   - Configure database credentials
   - Add API keys (TVDB, TMDB, Tautulli)

### Build and Deploy

```bash
# Build production image
docker-compose -f docker-compose.production.yml build

# Start production environment
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f web

# Stop containers
docker-compose -f docker-compose.production.yml down
```

### Run Database Migrations

```bash
# Execute migrations in the web container
docker-compose -f docker-compose.production.yml exec web bundle exec rake db:migrate
```

### Production Features

- **Multi-stage build**: Smaller final image size
- **Non-root user**: Enhanced security
- **Health checks**: Automatic container health monitoring
- **Puma web server**: Production-grade with multiple workers
- **PostgreSQL database**: Persistent data storage
- **Network isolation**: Services communicate via internal network
- **No volume mounts**: Code baked into image for consistency
- **Optimized dependencies**: Only production gems installed

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@db:5432/mmdb_production` |
| `SESSION_SECRET` | Session encryption key (≥64 chars) | Generated secure random string |
| `POSTGRES_PASSWORD` | Database password | Strong random password |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `mmdb_production` | Database name |
| `POSTGRES_USER` | `postgres` | Database user |
| `WEB_CONCURRENCY` | `2` | Number of Puma workers |
| `PUMA_THREADS` | `5` | Threads per worker |
| `PORT` | `4666` | Application port |

### API Keys

Configure these based on your external service accounts:
- `TAUTULLI_KEY`
- `TVDB_API_KEY`
- `TVDB_PIN`
- `TMDB_API_KEY`

## Generating a Secure Session Secret

```bash
# Generate a 64-byte random secret
ruby -e "require 'securerandom'; puts SecureRandom.hex(64)"
```

## Container Management

### View Container Status
```bash
docker-compose -f docker-compose.production.yml ps
```

### Access Container Shell
```bash
docker-compose -f docker-compose.production.yml exec web bash
```

### View Database Logs
```bash
docker-compose -f docker-compose.production.yml logs -f db
```

### Restart Services
```bash
docker-compose -f docker-compose.production.yml restart web
```

## Scaling

Scale web workers horizontally:
```bash
docker-compose -f docker-compose.production.yml up -d --scale web=3
```

Note: You'll need a load balancer (nginx/traefik) in front for this.

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs web

# Check health status
docker inspect mmdb_web --format='{{.State.Health.Status}}'
```

### Database connection issues
```bash
# Verify database is running
docker-compose -f docker-compose.production.yml exec db pg_isready

# Check database logs
docker-compose -f docker-compose.production.yml logs db
```

### Reset everything
```bash
# Stop and remove all containers, networks, and volumes
docker-compose -f docker-compose.production.yml down -v

# Rebuild from scratch
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use Docker secrets** for sensitive data in production
3. **Keep images updated** - Regularly rebuild with latest base images
4. **Scan for vulnerabilities** - Use `docker scan mmdb-web:latest`
5. **Run as non-root** - Production image uses `appuser`
6. **Use strong secrets** - Generate random SESSION_SECRET and database passwords

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

Container health status:
```bash
docker-compose -f docker-compose.production.yml ps
```

## Backup and Restore

### Backup Database
```bash
docker-compose -f docker-compose.production.yml exec db \
  pg_dump -U postgres mmdb_production > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose -f docker-compose.production.yml exec -T db \
  psql -U postgres mmdb_production
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild image
docker-compose -f docker-compose.production.yml build

# Restart with new image
docker-compose -f docker-compose.production.yml up -d

# Run any new migrations
docker-compose -f docker-compose.production.yml exec web bundle exec rake db:migrate
```
