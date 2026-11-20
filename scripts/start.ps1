$ErrorActionPreference='Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path '.env')) { & "$PSScriptRoot\setup.ps1" }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker Desktop nao encontrado. Instale e inicie o Docker Desktop.' }
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { throw 'Falha ao construir/iniciar os containers. Execute docker compose logs api web.' }
docker compose ps
Write-Host 'Interface: http://localhost:8080'
Write-Host 'API health: http://localhost:8080/api/health'
