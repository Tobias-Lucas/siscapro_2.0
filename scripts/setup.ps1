$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (Test-Path '.env') { Write-Host '.env existente preservado. Nada foi sobrescrito.'; exit 0 }
function New-Secret([int]$n) {
    $bytes = New-Object byte[] $n
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}
$jwt = New-Secret 48
$db = New-Secret 20
$admin = (New-Secret 12) + 'Aa9!'
$content = [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path '.env.example'))
$content = [regex]::Replace($content,'(?m)^JWT_SECRET=.*$', "JWT_SECRET=$jwt")
$content = [regex]::Replace($content,'(?m)^POSTGRES_PASSWORD=.*$', "POSTGRES_PASSWORD=$db")
$content = $content.Replace('change-me-now', $db)
$content = [regex]::Replace($content,'(?m)^AITINET_ADMIN_PASSWORD=.*$', "AITINET_ADMIN_PASSWORD=$admin")

[System.IO.File]::WriteAllText((Join-Path (Get-Location).Path '.env'),$content,(New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Proativa 2.0: ambiente local configurado.'
Write-Host 'Administrador inicial: consulte AITINET_ADMIN_EMAIL e AITINET_ADMIN_PASSWORD no arquivo .env local.'
Write-Host 'Contas ficticias desabilitadas por padrao.'
Write-Host 'As senhas estao em .env. Nao use em producao.'
