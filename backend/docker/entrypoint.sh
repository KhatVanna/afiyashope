#!/bin/sh
set -e

cd /app

if [ "${APP_ENV:-production}" = "production" ]; then
  MISSING_VARIABLES=""
  append_missing() {
    if [ -n "$MISSING_VARIABLES" ]; then
      MISSING_VARIABLES="${MISSING_VARIABLES}, "
    fi
    MISSING_VARIABLES="${MISSING_VARIABLES}$1"
  }

  [ -n "${APP_KEY:-}" ] || append_missing "APP_KEY"
  [ -n "${APP_URL:-}" ] || append_missing "APP_URL"
  [ "${DB_CONNECTION:-}" = "pgsql" ] || append_missing "DB_CONNECTION"
  [ -n "${DB_URL:-}" ] || append_missing "DB_URL"

  if [ -n "$MISSING_VARIABLES" ]; then
    echo "ERROR: Missing required production variable(s): ${MISSING_VARIABLES}." >&2
    exit 1
  fi

  MIGRATION_URL="${DB_DIRECT_URL:-$DB_URL}"
  MIGRATION_HOST="${MIGRATION_URL#*://}"
  MIGRATION_HOST="${MIGRATION_HOST#*@}"
  MIGRATION_HOST="${MIGRATION_HOST%%/*}"
  MIGRATION_HOST="${MIGRATION_HOST%%\?*}"
  MIGRATION_HOST="${MIGRATION_HOST%%:*}"

  case "$MIGRATION_HOST" in
    "")
      echo "ERROR: DB_DIRECT_URL must be set, or DB_URL must contain a direct PostgreSQL host." >&2
      exit 1
      ;;
    *-pooler*)
      if [ -n "${DB_DIRECT_URL:-}" ]; then
        echo "ERROR: DB_DIRECT_URL must use a direct PostgreSQL host, not a -pooler endpoint." >&2
      else
        echo "ERROR: DB_DIRECT_URL is required when DB_URL uses a -pooler endpoint." >&2
      fi
      exit 1
      ;;
  esac
fi

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
