#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  echo '.env existente foi preservado. Nada foi sobrescrito.'
  exit 0
fi
command -v openssl >/dev/null 2>&1 || { echo 'openssl necessario para gerar senhas'; exit 1; }
JWT=$(openssl rand -hex 48)
DB=$(openssl rand -hex 20)
ADMIN="$(openssl rand -hex 12)Aa9!"
sed \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=$JWT|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$DB|" \
  -e "s|change-me-now|$DB|g" \
  -e "s|^AITINET_ADMIN_PASSWORD=.*|AITINET_ADMIN_PASSWORD=$ADMIN|" \
  .env.example > .env
chmod 600 .env
printf '\nProativa 2.0: ambiente local configurado.\n'
printf 'Administrador inicial: consulte o email e a senha no arquivo .env local.\n'
printf 'Contas ficticias desativadas por padrao.\n'
printf 'Essas senhas tambem estao em .env. Nao use em producao.\n'
