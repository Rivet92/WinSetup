# ============================================================
#  WinSetup - installs the programs in the "{{LIST_NAME}}" list
#
#  Usage:
#    iwr https://winsetup.jlerga.dev/{{LIST_NAME}}.ps1 -UseBasicParsing | iex
# ============================================================

$ErrorActionPreference = "Stop"

$ListName = "{{LIST_NAME}}"
$BaseUrl  = "https://winsetup.jlerga.dev"
$ListUrl  = "$BaseUrl/packagelists/$ListName.txt"

# Mensajes en el idioma del sistema (es; cualquier otro en ingles).
$Es = (Get-UICulture).Name -like "es*"
if ($Es) {
    $MsgTitle    = "WinSetup - lista '{0}'"
    $MsgNoWinget = "winget no esta instalado o no esta en el PATH. Se requiere Windows 10/11."
    $MsgAdmin    = "Se requieren privilegios de administrador."
    $MsgElevate  = "Se reiniciara el script con elevacion (acepta la peticion UAC)..."
    $MsgPress    = "Pulsa Enter para continuar..."
    $MsgDownload = "Descargando lista de paquetes..."
    $MsgEmpty    = "La lista no contiene ningun paquete."
    $MsgCount    = "Se instalaran {0} paquetes:"
    $MsgInstall  = ">> Instalando {0} ..."
    $MsgFailed   = "Fallo al instalar '{0}' (codigo {1}). Continuando..."
    $MsgDone     = "Listo! Equipo configurado :)"
} else {
    $MsgTitle    = "WinSetup - list '{0}'"
    $MsgNoWinget = "winget is not installed or not on the PATH. Windows 10/11 is required."
    $MsgAdmin    = "Administrator privileges are required."
    $MsgElevate  = "The script will restart with elevation (accept the UAC prompt)..."
    $MsgPress    = "Press Enter to continue..."
    $MsgDownload = "Downloading package list..."
    $MsgEmpty    = "The list contains no packages."
    $MsgCount    = "Installing {0} packages:"
    $MsgInstall  = ">> Installing {0} ..."
    $MsgFailed   = "Failed to install '{0}' (code {1}). Continuing..."
    $MsgDone     = "Done! Machine configured :)"
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host ("  " + ($MsgTitle -f $ListName)) -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw $MsgNoWinget
}

# Si no tenemos permisos de administrador, nos relanzamos elevados
# (una unica peticion UAC) y salimos. El script se vuelve a descargar
# porque con iwr | iex no existe como fichero en disco.
$IsAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Write-Host ""
    Write-Host $MsgAdmin -ForegroundColor Yellow
    Write-Host $MsgElevate -ForegroundColor Yellow
    Write-Host ""
    Read-Host $MsgPress | Out-Null
    $ElevatedCmd = "iwr '$BaseUrl/$ListName.ps1' -UseBasicParsing | iex"
    Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $ElevatedCmd
    exit
}

Write-Host $MsgDownload -ForegroundColor Yellow
$response = Invoke-WebRequest $ListUrl -UseBasicParsing
$packages = $response.Content -split "`r?`n" |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -and -not $_.StartsWith("#") }

if ($packages.Count -eq 0) {
    throw $MsgEmpty
}

Write-Host ($MsgCount -f $packages.Count) -ForegroundColor Yellow
$packages | ForEach-Object { Write-Host "  - $_" }
Write-Host ""

foreach ($pkg in $packages) {
    Write-Host ($MsgInstall -f $pkg) -ForegroundColor Cyan
    winget install --id $pkg --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    if ($LASTEXITCODE -ne 0) {
        Write-Warning ($MsgFailed -f $pkg, $LASTEXITCODE)
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  $MsgDone" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
