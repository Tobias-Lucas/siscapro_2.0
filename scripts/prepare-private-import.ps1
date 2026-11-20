$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$File = Join-Path $Root '.env.development'
if (-not (Test-Path -LiteralPath $File -PathType Leaf)) {
  throw 'Arquivo .env.development ausente. Execute npm run dev:setup antes do preparo local.'
}
$text = [System.IO.File]::ReadAllText($File, [System.Text.Encoding]::UTF8)
# Generate a local-only secret if absent or still a placeholder. Never print it.
if ($text -notmatch '(?m)^IMPORT_DB_PASSWORD=([A-Za-z0-9]{20,})\s*$') {
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $data = New-Object byte[] 32
  try { $rng.GetBytes($data) } finally { $rng.Dispose() }
  $pwd = ([BitConverter]::ToString($data)).Replace('-', '').ToLowerInvariant()
  if ($text -match '(?m)^IMPORT_DB_PASSWORD=') {
    $text = [regex]::Replace($text, '(?m)^IMPORT_DB_PASSWORD=.*$', "IMPORT_DB_PASSWORD=$pwd")
  } else {
    $text = $text.TrimEnd() + "`nIMPORT_DB_PASSWORD=$pwd`n"
  }
}
foreach ($pair in @(@('IMPORT_DB_PORT','3310'), @('LOCAL_SQL_IMPORT_ENABLED','true'), @('DEV_USERS_PROVISIONING','CONFIRMED_LOCAL_ONLY'))) {
  $key = $pair[0]
  $value = $pair[1]
  if ($text -match "(?m)^$key=") {
    $text = [regex]::Replace($text, "(?m)^$key=.*$", "$key=$value")
  } else {
    $text = $text.TrimEnd() + "`n$key=$value`n"
  }
}
[System.IO.File]::WriteAllText($File, $text, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Importador e provisionamento local habilitados. Segredo protegido no .env.development.'
Write-Host 'Reinicie a API; o PostgreSQL e os volumes Docker nao foram alterados.'
