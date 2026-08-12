# ==============================================================================
# PowerShell Script: Build Android APK for Unit Price Compare
# ==============================================================================
# Usage in PowerShell:
#   .\build-apk.ps1
#
# Requirements on Windows host machine:
#   1. Node.js (v18+) & npm
#   2. Java Development Kit (JDK 17 or 21)
#   3. Android SDK (via Android Studio or command-line tools)
#   4. Environment variable ANDROID_HOME set to your Android SDK location
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Building Android APK (Capacitor Flow)   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Environment & Secrets Check
$EnvFile = ".env"
$EnvLocalFile = ".env.local"

if (!(Test-Path $EnvFile) -and !(Test-Path $EnvLocalFile)) {
    Write-Host "[!] No .env or .env.local file found." -ForegroundColor Yellow
    Write-Host "    Creating default .env with VITE_GEMINI_API_KEY template..." -ForegroundColor Yellow
    Set-Content -Path $EnvFile -Value "# Gemini API Key embedded into client-side Android APK build`nVITE_GEMINI_API_KEY=""YOUR_GEMINI_API_KEY_HERE"""
    Write-Host "[+] Created .env file. Please edit .env and insert your API key if needed." -ForegroundColor Green
} else {
    Write-Host "[+] Found environment file for build secrets." -ForegroundColor Green
}

# 2. Check Node.js and npm
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Header
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH. Please install Node.js."
}

# 3. Check / Install Capacitor dependencies
Write-Host "`n[2/6] Ensuring Capacitor dependencies are installed..." -ForegroundColor Header
if (!(Test-Path "node_modules/@capacitor/core")) {
    Write-Host "    Installing Capacitor CLI and Android runtime..." -ForegroundColor Yellow
    npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev
} else {
    Write-Host "[+] Capacitor dependencies found in node_modules." -ForegroundColor Green
}

# 4. Build Vite Static Assets
Write-Host "`n[3/6] Building static web application (dist)..." -ForegroundColor Header
npm run build

if (!(Test-Path "dist")) {
    Write-Error "Build failed: 'dist' folder was not generated."
}

# 5. Initialize Android Platform if needed
Write-Host "`n[4/6] Setting up Android platform..." -ForegroundColor Header
if (!(Test-Path "android")) {
    Write-Host "    Adding Android platform to Capacitor project..." -ForegroundColor Yellow
    npx cap add android
} else {
    Write-Host "[+] Existing 'android' folder detected." -ForegroundColor Green
}

# 6. Sync Web Assets to Android Project
Write-Host "`n[5/6] Syncing web assets to Android native project..." -ForegroundColor Header
npx cap sync android

# 7. Compile Android APK using Gradle
Write-Host "`n[6/6] Compiling Android APK via Gradle..." -ForegroundColor Header
Set-Location android

if ($IsWindows -or $env:OS -like "*Windows*") {
    if (Test-Path ".\gradlew.bat") {
        .\gradlew.bat assembleDebug
    } else {
        gradlew assembleDebug
    }
} else {
    chmod +x gradlew
    ./gradlew assembleDebug
}

Set-Location ..

$ApkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $ApkPath) {
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host " SUCCESS! APK Build Completed Successfully " -ForegroundColor Green
    Write-Host " APK File Output Path:" -ForegroundColor Green
    Write-Host " $(Resolve-Path $ApkPath)" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "`n[!] Gradle process finished. Check android/app/build/outputs/apk/ for generated APK." -ForegroundColor Yellow
}
