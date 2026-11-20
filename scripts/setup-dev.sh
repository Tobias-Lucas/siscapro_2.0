#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ -f .env.development ]]; then echo ".env.development ja existe; nada foi sobrescrito."; exit 0; fi
randhex(){ od -An -N"$1" -tx1 /dev/urandom | tr -d ' 
'; }
DB_PASSWORD="$(randhex 24)"
JWT_SECRET="$(randhex 64)"
ADMIN_PASSWORD="$(randhex 24)"
cat > .env.development <<EOF
NODE_ENV=development
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
JWT_EXPIRES_IN=8h
JWT_SECRET=$JWT_SECRET
POSTGRES_DB=proativa_dev
POSTGRES_USER=proativa_dev
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_PORT=5433
REDIS_PORT=6380
DATABASE_URL=postgresql://proativa_dev:$DB_PASSWORD@localhost:5433/proativa_dev?schema=public
REDIS_URL=redis://localhost:6380
AITINET_ADMIN_EMAIL=admin@proativa.local
AITINET_ADMIN_NAME=Administrador do Sistema
AITINET_ADMIN_PASSWORD=$ADMIN_PASSWORD
DOCUMENTS_DIR=./.local-documents
LEGACY_ENABLED=false
LEGACY_ENABLE_ACCOUNT_LOGIN=false
DEMO_SEED_ENABLED=false
EOF
cat > DEV_ADMIN_CREDENTIALS.txt <<EOF
Conta inicial de DESENVOLVIMENTO LOCAL. Nao reutilize em homologacao ou producao.
E-mail: admin@proativa.local
Senha: $ADMIN_PASSWORD
EOF
chmod 600 .env.development DEV_ADMIN_CREDENTIALS.txt
echo "Ambiente local criado. Nenhum volume existente foi alterado."
echo "1. npm run dev:infra:up"
echo "2. npm run db:migrate:dev"
echo "3. Em terminais separados: npm run dev:api e npm run dev:web"
echo "Credenciais locais gravadas em DEV_ADMIN_CREDENTIALS.txt. Proteja esse arquivo."
