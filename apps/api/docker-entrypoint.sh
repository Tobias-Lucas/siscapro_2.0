#!/bin/sh
set -eu
cd /app
: "${DATABASE_URL:?DATABASE_URL must be set before migrations}"
npx prisma migrate deploy
if [ "$#" -gt 0 ]; then
  exec "$@"
fi
exec node dist/main.js
