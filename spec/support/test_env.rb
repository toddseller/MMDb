# Fixed values so local runs match CI, which has no .env, and real keys never reach a test.
# Shared by the RSpec suite and the browser-test server, and required before the app loads.
{
  'JWT_SECRET' => 'test-jwt-secret', 'JWT_ISSUER' => 'test-issuer',
  'PLEX_USER' => 'test-plex-user', 'PLEX_USER_ID' => '1', 'PLEX_WEBHOOK_SECRET' => 'test-plex-webhook-secret',
  'TMDB_KEY' => 'test-tmdb-key', 'TMDB_TOKEN' => 'test-tmdb-token',
  'TVDB_APIKEY' => 'test-tvdb-apikey', 'TVDB_PIN' => 'test-tvdb-pin', 'TVDB_TOKEN' => 'test-tvdb-token',
  'TAUTULLI_KEY' => 'test-tautulli-key', 'LIBRARY_KEY' => 'test-library-key', 'HEROKU_KEY' => 'test-heroku-key',
  'AWS_ACCESS_KEY_ID' => 'test-aws-access-key-id', 'AWS_SECRET_ACCESS_KEY' => 'test-aws-secret-access-key',
  'AWS_REGION' => 'us-west-2', 'ARTWORK_BUCKET' => 'myflix-stream'
}.each { |name, value| ENV[name] = value }
