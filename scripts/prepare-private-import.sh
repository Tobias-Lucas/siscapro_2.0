#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
file="$root/.env.development"
[[ -f "$file" ]] || { echo 'Execute npm run dev:setup:unix primeiro.' >&2; exit 1; }
python3 - "$file" <<'PY'
import pathlib, re, secrets, sys
file = pathlib.Path(sys.argv[1]); text=file.read_text(encoding='utf-8')
keys = {
  'IMPORT_DB_PASSWORD':secrets.token_hex(32),
  'IMPORT_DB_PORT':'3310',
  'LOCAL_SQL_IMPORT_ENABLED':'true',
  'DEV_USERS_PROVISIONING':'CONFIRMED_LOCAL_ONLY',
}
for key,value in keys.items():
 match=re.search(rf'(?m)^{key}=(.*)$',text)
 if key=='IMPORT_DB_PASSWORD' and match and re.fullmatch('[A-Za-z0-9]{20,}',match.group(1)):continue
 if match:text=re.sub(rf'(?m)^{key}=.*$',f'{key}={value}',text)
 else:text=text.rstrip('\n')+f'\n{key}={value}\n'
file.write_text(text,encoding='utf-8')
PY
chmod 600 "$file"
echo 'Importador e provisionamento local habilitados. Reinicie a API.'
