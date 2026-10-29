# Fixed values so local runs match CI, which has no .env, and real keys never reach a test.
# Shared by the RSpec suite and the browser-test server, and required before the app loads.
{
  'JWT_SECRET' => 'test-jwt-secret', 'JWT_ISSUER' => 'test-issuer',
  'SESSION_SECRET' => 'test-session-secret-at-least-64-bytes-long-as-rack-session-requires',
  'PLEX_USER' => 'test-plex-user', 'PLEX_USER_ID' => '1', 'PLEX_WEBHOOK_SECRET' => 'test-plex-webhook-secret',
  'TMDB_TOKEN' => 'test-tmdb-token',
  'TAUTULLI_KEY' => 'test-tautulli-key', 'LIBRARY_KEY' => 'test-library-key',
  'AWS_ACCESS_KEY_ID' => 'test-aws-access-key-id', 'AWS_SECRET_ACCESS_KEY' => 'test-aws-secret-access-key',
  'AWS_REGION' => 'us-west-2', 'ARTWORK_BUCKET' => 'myflix-stream'
}.each { |name, value| ENV[name] = value }

# bcrypt's default cost takes about 0.2 s per hash, paid by every test user and sign-in; stored hashes keep their own cost.
require 'bcrypt'
BCrypt::Engine.cost = BCrypt::Engine::MIN_COST
