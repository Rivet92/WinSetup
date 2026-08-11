# ============================================================
#  WinSetup - instala los programas de la lista "{{LIST_NAME}}"
#
#  Uso:
#    iwr https://winsetup.jlerga.dev/{{LIST_NAME}}.ps1 -UseBasicParsing | iex
# ============================================================

$ErrorActionPreference = "Stop"

$ListName = "{{LIST_NAME}}"
$BaseUrl  = "https://winsetup.jlerga.dev"
$ListUrl  = "$BaseUrl/packagelists/$ListName.txt"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  WinSetup - lista '$ListName'" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "winget no esta instalado o no esta en el PATH. Se requiere Windows 10/11."
}

Write-Host "Descargando lista de paquetes..." -ForegroundColor Yellow
$response = Invoke-WebRequest $ListUrl -UseBasicParsing
$packages = $response.Content -split "`r?`n" |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -and -not $_.StartsWith("#") }

if ($packages.Count -eq 0) {
    throw "La lista no contiene ningun paquete."
}

Write-Host "Se instalaran $($packages.Count) paquetes:" -ForegroundColor Yellow
$packages | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

foreach ($pkg in $packages) {
    Write-Host ">> Instalando $pkg ..." -ForegroundColor Cyan
    winget install --id $pkg --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Fallo al instalar '$pkg' (codigo $LASTEXITCODE). Continuando..."
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Listo! Equipo configurado :)" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
