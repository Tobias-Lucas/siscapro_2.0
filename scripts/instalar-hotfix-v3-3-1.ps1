param(
    [string]$Destino = 'D:\SISCAPRO\Siscapro\PROATIVA_SISCAPRO_V3_3_0'
)

$ErrorActionPreference = 'Stop'
$Origem = Split-Path -Parent $PSScriptRoot
$Destino = [System.IO.Path]::GetFullPath($Destino)

if (-not (Test-Path (Join-Path $Origem 'apps\api\prisma\schema.prisma'))) {
    throw 'Pacote incompleto. Extraia todo o ZIP em uma pasta antes de executar.'
}

if (-not (Test-Path (Join-Path $Destino 'apps\api\prisma\schema.prisma'))) {
    throw 'Pasta de destino invalida. Informe o caminho da V3.3.0 instalada.'
}

$Arquivos = @(
    'VERSION',
    'package.json',
    'apps\api\package.json',
    'apps\web\package.json',
    'apps\api\prisma\schema.prisma',
    'apps\api\prisma\migrations\202611180001_incremental_original_import\migration.sql',
    'apps\api\prisma\migrations\202611180002_express_import_events\migration.sql',
    'apps\api\src\staging\original-import.worker.mjs',
    'apps\api\src\staging\sql-statement-stream.mjs',
    'apps\api\src\staging\stage-incremental.mjs',
    'apps\api\src\staging\import-telemetry.mjs',
    'apps\api\src\staging\import-scope.mjs',
    'apps\api\src\staging\staging.controller.ts',
    'apps\api\scripts\promote-batch.ts',
    'apps\web\src\modules\imports\ImportCenterPage.tsx',
    'apps\web\src\modules\imports\imports.css',
    'scripts\verify-import-incremental.mjs',
    'scripts\verify-v3-3.mjs',
    'scripts\instalar-hotfix-v3-3-1.ps1',
    'qa\import-express.test.mjs',
    'docs\DEMONSTRACAO_IMPORTACAO_19_11_2026.md',
    'CHANGELOG_V3_3_1.md'
)

foreach ($Rel in $Arquivos) {
    if (-not (Test-Path (Join-Path $Origem $Rel))) {
        throw "Arquivo nao encontrado no pacote: $Rel"
    }
}

$Data = Get-Date -Format 'yyyyMMdd_HHmmss'
$Backup = Join-Path $Destino ('.local-backups\pre_v331_' + $Data)
New-Item -ItemType Directory -Path $Backup -Force | Out-Null

foreach ($Rel in $Arquivos) {
    $Anterior = Join-Path $Destino $Rel
    if (Test-Path $Anterior) {
        $BackupAlvo = Join-Path $Backup $Rel
        New-Item -ItemType Directory -Path (Split-Path -Parent $BackupAlvo) -Force | Out-Null
        Copy-Item -LiteralPath $Anterior -Destination $BackupAlvo -Force
    }
}

foreach ($Rel in $Arquivos) {
    $Alvo = Join-Path $Destino $Rel
    New-Item -ItemType Directory -Path (Split-Path -Parent $Alvo) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $Origem $Rel) -Destination $Alvo -Force
}

Write-Host 'Arquivos do modulo de importacao atualizados.'
Write-Host "Backup dos arquivos antigos: $Backup"
Write-Host ''
Write-Host 'Proximo passo, depois de conferir o backup do PostgreSQL:'
Write-Host "cd $Destino"
Write-Host 'npm run db:migrate:dev'
Write-Host 'npm run db:generate'
Write-Host 'node qa/import-express.test.mjs'
Write-Host 'npm run build -w @proativa/api'
Write-Host 'npm run build -w @proativa/web'
Write-Host ''
Write-Host 'Este instalador nao alterou bancos, volumes, senhas ou arquivos SQL.'
