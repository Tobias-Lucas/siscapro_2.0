#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/qa/VALIDACAO_TECNICA_V3_3.txt"
: > "$LOG"
run(){
  name="$1"; shift
  echo "===== $name =====" | tee -a "$LOG"
  "$@" 2>&1 | tee -a "$LOG"
  echo "RESULTADO: APROVADO" | tee -a "$LOG"
}
run 'Instalacao dependencias' npm install --workspaces --include-workspace-root
run 'Verificacao estatica V3.3' node scripts/verify-v3-3.mjs
run 'Prisma format' npm run prisma:format -w @proativa/api
run 'Prisma validate' npm run db:validate
run 'Prisma generate' npm run db:generate
run 'Build API NestJS' npm run build -w @proativa/api
run 'Build frontend Vite' npm run build -w @proativa/web
run 'Compose desenvolvimento (configuracao)' docker compose -f docker-compose.infra.yml --env-file .env.development.example config -q
run 'Compose producao (configuracao)' docker compose -f docker-compose.production.yml --env-file .env.production.example config -q
echo "Validacao tecnica concluida: $LOG"
