$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$EnvPath = Join-Path $Root '.env.development'
$CredentialPath = Join-Path $Root 'DEV_ADMIN_CREDENTIALS.txt'
if (Test-Path $EnvPath) {
  Write-Host '.env.development ja existe. Nada foi sobrescrito.' -ForegroundColor Yellow
  Write-Host 'Confira o arquivo e mantenha os segredos existentes.'
  exit 0
}
function New-RandomHex([int]$Length) {
  $bytes = New-Object byte[] $Length
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}
$dbPassword = New-RandomHex 24
$jwtSecret = New-RandomHex 64
$adminPassword = New-RandomHex 24
$content = @"
NODE_ENV=development
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
JWT_EXPIRES_IN=8h
JWT_SECRET=$jwtSecret
POSTGRES_DB=proativa_dev
POSTGRES_USER=proativa_dev
POSTGRES_PASSWORD=$dbPassword
POSTGRES_PORT=5433
REDIS_PORT=6380
DATABASE_URL=postgresql://proativa_dev:$dbPassword@localhost:5433/proativa_dev?schema=public
REDIS_URL=redis://localhost:6380
AITINET_ADMIN_EMAIL=admin@proativa.local
AITINET_ADMIN_NAME=Administrador do Sistema
AITINET_ADMIN_PASSWORD=$adminPassword
DOCUMENTS_DIR=./.local-documents
LEGACY_ENABLED=false
LEGACY_ENABLE_ACCOUNT_LOGIN=false
DEMO_SEED_ENABLED=false
"@
Set-Content -Path $EnvPath -Value $content -Encoding ascii
Set-Content -Path $CredentialPath -Value @"
Conta inicial de DESENVOLVIMENTO LOCAL. Nao reutilize em homologacao ou producao.
E-mail: admin@proativa.local
Senha: $adminPassword
"@ -Encoding ascii
Write-Host 'Ambiente local criado. Nenhum volume existente foi alterado.' -ForegroundColor Green
Write-Host '1. npm run dev:infra:up'
Write-Host '2. npm run db:migrate:dev'
Write-Host '3. Em terminais separados: npm run dev:api e npm run dev:web'
Write-Host 'Credenciais locais gravadas em DEV_ADMIN_CREDENTIALS.txt. Proteja esse arquivo.' -ForegroundColor Yellow
