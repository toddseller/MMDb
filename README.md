# MMDb - My Movie Database

A full-featured personal media library manager built with Sinatra and PostgreSQL. Track your movie and TV show collection with automatic metadata fetching from multiple sources (TMDB, TVDB, Apple TV), Plex integration, and a modern REST API.

## Overview

MMDb is a Sinatra-based web application that helps you catalog and manage your personal movie and TV show collection. It integrates with external metadata providers to enrich your library with posters, ratings, episode information, and more. The application supports multiple users, JWT authentication, and provides both web and API interfaces.

### Key Features

- **Multi-source metadata aggregation**: TMDB, TVDB, and Apple TV APIs
- **TV show management**: Season and episode tracking with automatic metadata
- **Plex integration**: Webhook support for automatic library updates
- **RESTful API**: v2 and v3 endpoints with JWT authentication
- **User management**: Multi-user support with BCrypt password hashing
- **Responsive web interface**: ERB-based views with AJAX interactions
- **Production-ready**: Docker support with multi-stage builds and health checks

## Architecture

```
MMDb/
├── app/
│   ├── controllers/       # Route handlers (Sinatra)
│   │   ├── api_v2_controller.rb
│   │   ├── api_v3_controller.rb
│   │   ├── movies_controller.rb
│   │   ├── shows_controller.rb
│   │   ├── users_controller.rb
│   │   └── webhooks_controller.rb
│   ├── models/           # ActiveRecord models
│   │   ├── movie.rb
│   │   ├── show.rb
│   │   ├── season.rb
│   │   ├── episode.rb
│   │   └── user.rb
│   ├── helpers/          # View helpers
│   └── views/            # ERB templates
├── config/
│   ├── database.rb       # ActiveRecord configuration
│   ├── environment.rb    # Application bootstrap
│   └── puma.rb          # Puma web server config
├── db/
│   ├── migrate/         # Database migrations
│   └── seeds.rb         # Seed data
├── config.ru            # Rack configuration
└── Dockerfile.production
```

## Technology Stack

- **Ruby**: 3.4.8
- **Framework**: Sinatra 4.x with Rack 3.x
- **Database**: PostgreSQL 15
- **ORM**: ActiveRecord 7.2
- **Web Server**: Puma (multi-worker, clustered mode)
- **Authentication**: BCrypt + JWT
- **APIs**: HTTParty for external services
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Ruby 3.4.8 (via rbenv or RVM recommended)
- PostgreSQL 15+
- Bundler 2.x
- Docker & Docker Compose (for containerized deployment)

### External API Keys Required

You'll need API keys from:
- [TMDB](https://www.themoviedb.org/settings/api) (The Movie Database)
- [TVDB](https://thetvdb.com/api-information) (TheTVDB v4)
- Optional: Plex server token, Tautulli API key

## Installation & Configuration

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd MMDb
bundle install
```

### 2. Configure Environment

Copy the example environment file and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Database
DATABASE_URL=postgres://user:password@localhost:5432/mmdb
POSTGRES_DB=mmdb
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_secure_password

# Session Secret (MUST be at least 64 characters for Rack 3)
SESSION_SECRET=your_very_long_and_secure_session_secret_that_is_at_least_64_bytes_long

# JWT
JWT_SECRET=your_jwt_secret_at_least_64_characters_long_for_security
JWT_ISSUER=mmdb.yourdomain.com

# TMDB API (required)
TMDB_KEY=your_tmdb_api_key
TMDB_TOKEN=your_tmdb_bearer_token

# TVDB API (required)
TVDB_APIKEY=your_tvdb_api_key
TVDB_PIN=your_tvdb_pin
TVDB_USERNAME=your_tvdb_username
TVDB_USERKEY=your_tvdb_user_key
TVDB_TOKEN=your_tvdb_jwt_token

# Plex Integration (optional)
PLEX_USER=your_plex_username
PLEX_USER_ID=1
LIBRARY_KEY=1
TAUTULLI_KEY=your_tautulli_api_key

# Server Configuration
WEB_CONCURRENCY=2
PUMA_THREADS=5
PORT=4666
```

### 3. Database Setup

```bash
# Create database
createdb mmdb

# Run migrations
bundle exec rake db:migrate

# Optional: Seed initial data
bundle exec rake db:seed
```

## Running the Application

You have multiple options for running MMDb depending on your environment and needs.

### Option 1: Local Development (Rack/Rackup)

Best for active development with live reloading.

```bash
# Start with Rackup (development mode) - use WEB_CONCURRENCY=0 to avoid macOS fork issues
WEB_CONCURRENCY=0 bundle exec rackup config.ru -p 4666

# Or with explicit RACK_ENV
RACK_ENV=development WEB_CONCURRENCY=0 bundle exec rackup -o 0.0.0.0 -p 4666
```

Features:
- Auto-reloading on code changes (via `sinatra/reloader`)
- Detailed error pages
- Single-process execution (no worker forking on macOS)
- Access at `http://localhost:4666`

**Important for macOS users**: Always set `RACK_ENV=development` when using rackup. This prevents Puma from forking workers and avoids NSCharacterSet crashes. The `config/puma.rb` defaults to single-process mode in development.

### Option 2: Local with Puma (Production-like)

Simulates production environment locally with multi-worker support.

```bash
# Start Puma with production config
bundle exec puma -C config/puma.rb

# Or with custom settings
WEB_CONCURRENCY=2 PUMA_THREADS=5 bundle exec puma -C config/puma.rb
```

Features:
- Multi-worker, multi-threaded (default: 2 workers, 5 threads)
- Connection pooling
- Preload application for performance
- Production-ready configuration

### Option 3: Docker Compose (Development)

Best for isolating dependencies and matching team environments.

```bash
# Build and start
docker-compose up

# Rebuild after dependency changes
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f web

# Stop
docker-compose down
```

Configuration:
- Uses `Dockerfile` (standard Ruby image)
- Mounts local directory for live code changes
- Rack server with auto-reload
- Database connection via `DATABASE_URL` in `.env`
- Access at `http://localhost:4666`

### Option 4: Docker Compose (Production)

Best for production deployment with security hardening and optimizations.

```bash
# Start production stack
docker-compose -f docker-compose.production.yml up -d

# Build from scratch
docker-compose -f docker-compose.production.yml up --build

# View logs
docker-compose -f docker-compose.production.yml logs -f web

# Health check
docker-compose -f docker-compose.production.yml ps

# Stop
docker-compose -f docker-compose.production.yml down
```

Features:
- Uses `Dockerfile.production` with multi-stage build
- Smaller image size (~200MB vs 800MB)
- Runs as non-root user (`appuser`)
- Includes PostgreSQL 15 service with data persistence
- Puma in clustered mode (2 workers, 5 threads each)
- Built-in health checks (curl endpoint every 30s)
- Automatic container restart on failure
- Isolated bridge network
- Persistent volumes for PostgreSQL data

Production Configuration:
```yaml
# docker-compose.production.yml highlights
services:
  web:
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4666/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
  db:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

### Option 5: Rake Tasks

```bash
# List available tasks
bundle exec rake -T

# Run database migrations
bundle exec rake db:migrate

# Rollback migration
bundle exec rake db:rollback

# Seed database
bundle exec rake db:seed

# Generate new migration
bundle exec rake generate:migration NAME=add_column_to_table

# Generate new model
bundle exec rake generate:model NAME=ModelName

# Open console with app loaded
bundle exec rake console

# Run tests (if configured)
bundle exec rake spec
```

## API Documentation

### Authentication

MMDb provides JWT-based authentication through the v3 API.

#### Sign Up
```bash
POST /api/v3/signup
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "user_name": "johndoe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```bash
POST /api/v3/authenticate
Content-Type: application/json

{
  "username_email": "johndoe",
  "password": "secure_password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "userName": "johndoe",
    "email": "john@example.com",
    "avatar": "https://..."
  }
}
```

#### Authenticated Requests
Include JWT in Authorization header:
```bash
GET /api/v3/user
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Key Endpoints

#### Movies
- `GET /users/:user_id/movies` - List user's movies
- `GET /users/:user_id/movies/:id` - Movie details
- `POST /users/:user_id/movies` - Add movie to collection
- `PUT /users/:user_id/movies/:id` - Update movie
- `DELETE /users/:user_id/movies/:id` - Remove movie

#### TV Shows
- `GET /users/:user_id/shows` - List user's TV shows
- `GET /users/:user_id/shows/:id` - Show details with episodes
- `POST /users/:user_id/shows` - Add show and season
- `PUT /users/:user_id/shows/:id` - Update show/season/episode

#### API v3 (Recommended)
- `GET /api/v3/homepage` - Homepage data (top movies, recent additions)
- `GET /api/v3/users/:user_id/movies` - Paginated movies
- `GET /api/v3/users/:user_id/shows` - Shows with metadata
- `POST /api/v3/movies/search` - Search movies by title
- `POST /api/v3/shows/search` - Search shows by title

#### Webhooks
- `POST /webhooks/plex` - Plex webhook handler (automatic library updates)

## Plex Integration

MMDb can automatically update your library via Plex webhooks.

### Setup

1. Configure Plex webhook in Plex settings:
   ```
   http://your-server:4666/webhooks/plex?user_id=YOUR_USER_ID
   ```

2. Set environment variables:
   ```bash
   PLEX_USER=your_plex_username
   PLEX_USER_ID=1
   LIBRARY_KEY=1
   ```

3. Supported events:
   - `library.new` - Automatically adds new media to MMDb
   - Matches movies and shows using TMDB/TVDB/Apple TV APIs

## Database Management

### Migrations

Create a new migration:
```bash
bundle exec rake generate:migration NAME=add_column_to_table
```

Migration template:
```ruby
class AddColumnToTable < ActiveRecord::Migration[7.2]
  def change
    add_column :table_name, :column_name, :string
  end
end
```

Run migrations:
```bash
bundle exec rake db:migrate
```

### Connection Pooling

Puma configuration (`config/puma.rb`) handles connection pooling:
```ruby
workers ENV.fetch('WEB_CONCURRENCY', 2).to_i  # 2 processes
threads_count = ENV.fetch('PUMA_THREADS', 5).to_i  # 5 threads each

before_worker_boot do
  ActiveRecord::Base.connection_pool.disconnect!
end

after_worker_boot do
  ActiveRecord::Base.establish_connection
end
```

Total connections: `workers * threads = 2 * 5 = 10 connections`

## Troubleshooting

### Common Issues

#### 1. 500 Internal Server Error on `/users/1/shows`
**Symptom**: Intermittent errors when accessing user collections

**Cause**: Race condition in `Episode.episode_count` when user has shows without episodes

**Fix**: Already patched in `app/models/episode.rb:19` - ensures empty arrays don't cause nil errors

#### 2. Database Connection Errors
**Symptom**: `PG::ConnectionBad` or `ActiveRecord::ConnectionNotEstablished`

**Solutions**:
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL

# Reset connection pool (in production)
docker-compose -f docker-compose.production.yml restart web
```

#### 3. Puma Won't Start
**Symptom**: `Address already in use - bind(2) for "0.0.0.0" port 4666`

**Solutions**:
```bash
# Find process using port 4666
lsof -i :4666

# Kill process
kill -9 <PID>

# Or use different port
PORT=4667 bundle exec puma -C config/puma.rb
```

#### 4. TVDB API Token Expired
**Symptom**: 401 errors when fetching TV show metadata

**Solution**: Token auto-refreshes via `Show.tvdb_auth()`. Ensure `TVDB_APIKEY` and `TVDB_PIN` are correct in `.env`.

#### 5. Docker Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check logs
docker-compose logs web
```

### Health Checks

Production containers include health checks:
```bash
# Check container health
docker-compose -f docker-compose.production.yml ps

# Manual health check
curl -f http://localhost:4666/
```

## Performance Tuning

### Puma Configuration

Adjust worker/thread count based on available resources:

```bash
# For 2 CPU cores, 4GB RAM
WEB_CONCURRENCY=2 PUMA_THREADS=5

# For 4 CPU cores, 8GB RAM
WEB_CONCURRENCY=4 PUMA_THREADS=8

# Formula: threads * workers should not exceed database connection pool
```

### Database Optimization

```ruby
# In config/database.rb, adjust pool size
ActiveRecord::Base.establish_connection(
  adapter: 'postgresql',
  url: ENV['DATABASE_URL'],
  pool: ENV.fetch('DB_POOL', 10).to_i  # Match Puma threads * workers
)
```

### Caching

Consider adding Redis for caching expensive API calls:
```bash
REDISTOGO_URL=redis://localhost:6379/0
```

## Security Considerations

### Production Checklist

- ✅ Use strong `SESSION_SECRET` (min 64 characters)
- ✅ Use strong `JWT_SECRET` (min 64 characters)
- ✅ Run containers as non-root user (`appuser`)
- ✅ Keep API keys in `.env`, never commit
- ✅ Use HTTPS in production (reverse proxy with nginx/Caddy)
- ✅ Enable CORS only for trusted domains (edit `config.ru`)
- ✅ Regularly update dependencies: `bundle update`
- ✅ Monitor logs for suspicious activity

### Securing API Keys

```bash
# Generate secure secrets
ruby -rsecurerandom -e 'puts SecureRandom.hex(64)'

# Set strict file permissions
chmod 600 .env
```

## Deployment

### Docker Production Deployment

```bash
# On production server
git clone <repository-url>
cd MMDb
cp .env.example .env
# Edit .env with production credentials
nano .env

# Start services
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker-compose -f docker-compose.production.yml exec web bundle exec rake db:migrate

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

### Systemd Service (Non-Docker)

Create `/etc/systemd/system/mmdb.service`:
```ini
[Unit]
Description=MMDb Application
After=network.target postgresql.service

[Service]
Type=simple
User=mmdb
WorkingDirectory=/var/www/mmdb
Environment="RACK_ENV=production"
EnvironmentFile=/var/www/mmdb/.env
ExecStart=/usr/local/bin/bundle exec puma -C config/puma.rb
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable mmdb
sudo systemctl start mmdb
sudo systemctl status mmdb
```

## Development

### Adding New Features

1. Create migration if database changes needed
2. Update model in `app/models/`
3. Add routes in appropriate controller
4. Add views in `app/views/` (if web interface)
5. Test manually or add specs
6. Update API documentation above

### Code Style

- Follow Ruby community style guide
- Use 2-space indentation
- ActiveRecord models use singular names
- Controllers use plural resource names
- Keep API backward compatible when possible

## License

This project was created as a Phase-2 passion project at Dev Bootcamp.

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

**Built with ❤️ using Ruby, Sinatra, and PostgreSQL**
