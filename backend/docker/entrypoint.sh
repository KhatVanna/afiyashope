#!/bin/sh
set -e

cd /app

mkdir -p \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache

php artisan package:discover --ansi >/dev/null 2>&1 || true

if [ -n "${APP_KEY:-}" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache || true
fi

# Railway injects PORT; FrankenPHP/Caddy reads SERVER_NAME / {$PORT}.
export PORT="${PORT:-8080}"
export SERVER_NAME=":${PORT}"

# Start FrankenPHP first so /up healthchecks pass while Neon migrate runs.
frankenphp run --config /etc/caddy/Caddyfile &
SERVER_PID=$!

sleep 2

# Use the direct PostgreSQL connection for production migrations.
MIGRATION_DB=pgsql
if [ "${APP_ENV:-production}" = "production" ]; then
  if [ -z "${DB_DIRECT_URL:-}" ]; then
    echo "ERROR: DB_DIRECT_URL must be set for production migrations." >&2
    kill "${SERVER_PID}"
    exit 1
  fi
  MIGRATION_DB=pgsql_direct
fi

if ! php artisan migrate --database="${MIGRATION_DB}" --force --no-interaction; then
  echo "WARNING: migrate failed on first attempt; retrying once..." >&2
  sleep 3
  if ! php artisan migrate --database="${MIGRATION_DB}" --force --no-interaction; then
    echo "ERROR: migration failed twice; refusing to serve the application." >&2
    kill "${SERVER_PID}"
    exit 1
  fi
fi

# Drop stale file-cache entries (corrupt catalog payloads from older deploys).
php artisan cache:clear >/dev/null 2>&1 || true

wait "${SERVER_PID}"
