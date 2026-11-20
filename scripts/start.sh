#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then sh scripts/setup.sh; fi
command -v docker >/dev/null 2>&1 || { echo 'Docker nao encontrado. Instale o Docker Engine/Compose.'; exit 1; }
docker compose up -d --build
docker compose ps
echo 'Acesse http://localhost:8080'
