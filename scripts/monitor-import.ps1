# Read-only monitor for a local MariaDB restore. Never prints SQL or personal data.
param(
  [ValidateRange(1,100)][int]$Samples = 12,
  [ValidateRange(2,300)][int]$IntervalSeconds = 15
)
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  if (-not (Test-Path '.env.development')) { throw 'Arquivo .env.development nao encontrado.' }
  $prev = @{}
  $query = "SHOW GLOBAL STATUS WHERE Variable_name IN ('Bytes_received','Com_insert','Innodb_data_written');"
  for ($i=1; $i -le $Samples; $i++) {
    $lines = @($query | & docker compose -f docker-compose.import.yml --env-file .env.development exec -T mariadb-import sh -c 'MYSQL_PWD=$MARIADB_ROOT_PASSWORD exec mariadb -uroot -N')
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel consultar os contadores do MariaDB. Verifique o Docker e o container mariadb-import.' }
    $now = @{}
    foreach ($line in $lines) {
      if ([string]$line -match '^(Bytes_received|Com_insert|Innodb_data_written)\s+(\d+)\s*$') {
        $now[$Matches[1]] = [int64]$Matches[2]
      }
    }
    if ($now.Count -eq 0) { throw 'O MariaDB nao retornou os contadores esperados.' }
    Write-Host ('[{0}] Amostra {1}/{2}' -f (Get-Date -Format 'HH:mm:ss'),$i,$Samples)
    foreach ($key in @('Bytes_received','Com_insert','Innodb_data_written')) {
      if ($now.ContainsKey($key)) {
        $delta = if ($prev.ContainsKey($key)) { $now[$key] - $prev[$key] } else { 0 }
        Write-Host ('  {0}: {1:N0} | variacao desde a ultima amostra: +{2:N0}' -f $key,$now[$key],$delta)
      }
    }
    $prev = $now
    if ($i -lt $Samples) { Start-Sleep -Seconds $IntervalSeconds }
  }
  Write-Host 'Mudancas nos contadores indicam atividade. Ausencia de mudanca isolada nao prova travamento.'
} finally { Pop-Location }
