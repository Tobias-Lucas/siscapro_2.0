param(
  [switch]$SkipInstall,
  [switch]$SkipFormat,
  [switch]$SkipDocker
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$QaDirectory = Join-Path $Root 'qa'
if (-not (Test-Path $QaDirectory)) {
  New-Item -ItemType Directory -Path $QaDirectory -Force | Out-Null
}
$Log = Join-Path $QaDirectory 'VALIDACAO_TECNICA_V3_3.txt'
if (Test-Path $Log) { Remove-Item $Log -Force }
Add-Content -Path $Log -Value 'PROATIVA 2.0 V3.3 - Validacao tecnica PowerShell 5.1'
Add-Content -Path $Log -Value ("Iniciado: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))

function Write-Skipped([string]$Name, [string]$Reason) {
  $message = "IGNORADO: $Name - $Reason"
  Add-Content -Path $Log -Value $message
  Write-Host $message -ForegroundColor Yellow
}

function Run-Step([string]$Name, [string]$Command, [string[]]$Arguments) {
  Write-Host "`n===== $Name =====" -ForegroundColor Cyan
  Add-Content -Path $Log -Value "`n===== $Name ====="

  # Fail on an unavailable command even though stderr warnings are tolerated.
  $null = Get-Command -Name $Command -ErrorAction Stop
  $originalPreference = $ErrorActionPreference
  $exitCode = $null
  try {
    # Windows PowerShell 5.1 can wrap native stderr (including npm warnings)
    # into ErrorRecord objects. Do not use Stop while collecting native output.
    # The native process exit code, not the presence of stderr, defines success.
    $ErrorActionPreference = 'Continue'
    $global:LASTEXITCODE = $null
    & $Command @Arguments 2>&1 |
      ForEach-Object { $_.ToString() } |
      Tee-Object -FilePath $Log -Append
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $originalPreference
  }

  if ($null -eq $exitCode) {
    throw "$Name nao retornou codigo de saida. Consulte $Log"
  }
  if ($exitCode -ne 0) {
    throw "$Name falhou com codigo $exitCode. Consulte $Log"
  }
  Add-Content -Path $Log -Value 'RESULTADO: APROVADO'
}

try {
  if ($SkipInstall) {
    Write-Skipped 'Instalacao dependencias' 'npm install ja foi executado anteriormente'
  }
  else {
    Run-Step 'Instalacao dependencias' 'npm' @('install', '--workspaces', '--include-workspace-root')
  }

  Run-Step 'Verificacao estatica V3.3' 'node' @('scripts/verify-v3-3.mjs')

  if ($SkipFormat) {
    Write-Skipped 'Prisma format' 'formatacao altera o schema e nao e obrigatoria para validar'
  }
  else {
    Run-Step 'Prisma format' 'npm' @('run', 'prisma:format', '-w', '@proativa/api')
  }

  Run-Step 'Prisma validate' 'npm' @('run', 'db:validate')
  Run-Step 'Prisma generate' 'npm' @('run', 'db:generate')
  Run-Step 'Build API NestJS' 'npm' @('run', 'build', '-w', '@proativa/api')
  Run-Step 'Build frontend Vite' 'npm' @('run', 'build', '-w', '@proativa/web')

  if ($SkipDocker) {
    Write-Skipped 'Compose desenvolvimento e producao' 'Docker nao verificado; validacao parcial'
  }
  else {
    Run-Step 'Compose desenvolvimento (configuracao)' 'docker' @('compose', '-f', 'docker-compose.infra.yml', '--env-file', '.env.development.example', 'config', '-q')
    # Production is not configured in the development workspace. Validate a temporary
    # Compose copy that points env_file to the PUBLIC example, without creating
    # .env.production, provisioning secrets, or touching running services.
    $ProductionCompose = Join-Path $Root 'docker-compose.production.yml'
    $ProductionExample = Join-Path $Root '.env.production.example'
    if (-not (Test-Path -LiteralPath $ProductionCompose -PathType Leaf)) {
      throw 'docker-compose.production.yml nao encontrado.'
    }
    if (-not (Test-Path -LiteralPath $ProductionExample -PathType Leaf)) {
      throw '.env.production.example nao encontrado.'
    }
    $SourceText = [System.IO.File]::ReadAllText($ProductionCompose, [System.Text.Encoding]::UTF8)
    $EnvFilePattern = '(?m)^([ \t]*env_file:[ \t]*)\.env\.production([ \t]*\r?)$'
    $EnvFileCount = [regex]::Matches($SourceText, $EnvFilePattern).Count
    if ($EnvFileCount -lt 1) {
      throw 'Nao foi localizada a referencia env_file: .env.production no Compose de producao.'
    }
    $ValidationComposeText = [regex]::Replace($SourceText, $EnvFilePattern, '${1}.env.production.example${2}')
    $ValidationComposePath = Join-Path $Root ('.docker-compose.production.check.' + [guid]::NewGuid().ToString('N') + '.yml')
    try {
      [System.IO.File]::WriteAllText($ValidationComposePath, $ValidationComposeText, [System.Text.UTF8Encoding]::new($false))
      $message = 'INFO: Compose de producao testado com .env.production.example em arquivo temporario; nenhuma credencial real de producao e necessaria.'
      Write-Host $message -ForegroundColor Yellow
      Add-Content -Path $Log -Value $message
      Run-Step 'Compose producao (somente configuracao estrutural)' 'docker' @('compose', '-f', $ValidationComposePath, '--env-file', $ProductionExample, 'config', '-q')
    }
    finally {
      if (Test-Path -LiteralPath $ValidationComposePath) {
        Remove-Item -LiteralPath $ValidationComposePath -Force
      }
    }
    $message = 'AVISO: Configuracao estrutural aprovada nao valida segredos, registry, imagens, migrations ou disponibilidade da producao.'
    Write-Host $message -ForegroundColor Yellow
    Add-Content -Path $Log -Value $message
  }

  Add-Content -Path $Log -Value ("Concluido: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
  if ($SkipDocker) {
    Write-Host "Validacao PARCIAL concluida (Docker ignorado). Relatorio: $Log" -ForegroundColor Yellow
  }
  else {
    Write-Host "Validacao tecnica concluida. Relatorio: $Log" -ForegroundColor Green
  }
}
catch {
  Add-Content -Path $Log -Value ("RESULTADO FINAL: REPROVADO - {0}" -f $_.Exception.Message)
  Write-Host "Validacao interrompida: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
