#!/bin/sh
set -e

: "${PORT:=10000}"
export PORT
cd /app/apps/api

# Provider URIs may carry driver-specific params (Aiven: ?ssl-mode=REQUIRED); TLS is configured below.
export DATABASE_URL="${DATABASE_URL%%\?*}"

MIGRATE_URL="$DATABASE_URL"
if [ -n "$DATABASE_SSL_CA" ]; then
  printf '%b\n' "$DATABASE_SSL_CA" > /tmp/db-ca.pem
  MIGRATE_URL="$DATABASE_URL?sslcert=/tmp/db-ca.pem&sslaccept=strict"
fi

DATABASE_URL="$MIGRATE_URL" npx prisma migrate deploy
SEED_IF_EMPTY=true npx prisma db seed

export CORS_ORIGIN="${CORS_ORIGIN:-${RENDER_EXTERNAL_URL:-http://localhost:$PORT}}"
export WEB_PROXY_TARGET=http://127.0.0.1:3000
PORT=3000 HOSTNAME=127.0.0.1 node /app/web/apps/web/server.js &

exec node dist/index.js
