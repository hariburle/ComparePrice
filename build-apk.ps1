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

# 1. Get Latest Git Code
Write-Host "`n[1/7] Fetching latest changes from Git..." -ForegroundColor Cyan
if (Test-Path .git) {
    if (Get-Command "git" -ErrorAction SilentlyContinue) {
        try {
            Write-Host "    Pulling latest commits from remote repository..." -ForegroundColor Yellow
            git pull
            Write-Host "[+] Git repository updated successfully." -ForegroundColor Green
        } catch {
            Write-Host "    [!] Git pull encountered an issue. Continuing with local files..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "    [!] Git command not found on host machine. Skipping remote update..." -ForegroundColor Yellow
    }
} else {
    Write-Host "    [.] Not running inside a Git repository. Skipping git pull." -ForegroundColor Yellow
}

# 2. Environment & Secrets Check
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

# 2. Check Node.js, npm, and Android SDK (ANDROID_HOME)
Write-Host "`n[2/7] Checking prerequisites..." -ForegroundColor Cyan
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH. Please install Node.js."
}

# Auto-detect ANDROID_HOME if not already set
if ([string]::IsNullOrEmpty($env:ANDROID_HOME)) {
    Write-Host "    ANDROID_HOME is not set. Searching for standard Android SDK location..." -ForegroundColor Yellow
    $DefaultPaths = @(
        "$env:LOCALAPPDATA\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk",
        "C:\Android\sdk"
    )
    
    foreach ($Path in $DefaultPaths) {
        if (Test-Path $Path) {
            $env:ANDROID_HOME = $Path
            Write-Host "    Found Android SDK at: $Path" -ForegroundColor Green
            Write-Host "    Temporarily set ANDROID_HOME environment variable." -ForegroundColor Green
            break
        }
    }
}

if ([string]::IsNullOrEmpty($env:ANDROID_HOME)) {
    Write-Warning "ANDROID_HOME is not set and could not be auto-detected in standard locations."
    Write-Host "    Please ensure Android SDK is installed and ANDROID_HOME is configured." -ForegroundColor Yellow
} else {
    Write-Host "    Android SDK Location (ANDROID_HOME): $env:ANDROID_HOME" -ForegroundColor Green
}

# 3. Check / Install Capacitor dependencies
Write-Host "`n[3/7] Ensuring Capacitor dependencies are installed..." -ForegroundColor Cyan
if (!(Test-Path "node_modules/@capacitor/core") -or !(Test-Path "node_modules/@capacitor/share")) {
    Write-Host "    Installing Capacitor CLI, Android runtime, and Share plugin..." -ForegroundColor Yellow
    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/share
} else {
    Write-Host "[+] Capacitor dependencies and Share plugin found in node_modules." -ForegroundColor Green
}

# 4. Build Vite Static Assets
Write-Host "`n[4/7] Building static web application (dist)..." -ForegroundColor Cyan
npm run build

if (!(Test-Path "dist")) {
    Write-Error "Build failed: 'dist' folder was not generated."
}

# 5. Initialize Android Platform if needed
Write-Host "`n[5/7] Setting up Android platform..." -ForegroundColor Cyan
if (!(Test-Path "android") -or !(Test-Path "android/gradlew.bat")) {
    if (Test-Path "android") {
        Write-Host "    'android' folder exists but is incomplete (missing gradlew.bat). Recreating platform..." -ForegroundColor Yellow
        Remove-Item -Path "android" -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "    Adding Android platform to Capacitor project..." -ForegroundColor Yellow
    npx cap add android
} else {
    Write-Host "[+] Existing valid 'android' folder detected." -ForegroundColor Green
}

# Ensure AndroidManifest.xml includes Camera and Storage permissions
$ManifestPath = "android/app/src/main/AndroidManifest.xml"
if (Test-Path $ManifestPath) {
    Write-Host "    Verifying Android permissions in AndroidManifest.xml..." -ForegroundColor Yellow
    $ManifestContent = Get-Content $ManifestPath -Raw
    
    $PermissionsToAdd = @(
        '<uses-permission android:name="android.permission.CAMERA" />',
        '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
        '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
        '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
        '<uses-feature android:name="android.hardware.camera" android:required="false" />',
        '<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />'
    )
    
    $Modified = $false
    foreach ($Perm in $PermissionsToAdd) {
        if ($ManifestContent -notlike "*$Perm*") {
            $ManifestContent = $ManifestContent -replace '</manifest>', "    $Perm`n</manifest>"
            $Modified = $true
        }
    }
    
    if ($Modified) {
        Set-Content -Path $ManifestPath -Value $ManifestContent -Encoding UTF8
        Write-Host "    [+] Added CAMERA and Storage permissions to AndroidManifest.xml!" -ForegroundColor Green
    } else {
        Write-Host "    [+] Camera permissions already verified in AndroidManifest.xml." -ForegroundColor Green
    }
}

# 6. Sync Web Assets to Android Project
Write-Host "`n[6/7] Syncing web assets to Android native project..." -ForegroundColor Cyan
npx cap sync android

# 7. Compile Android APK using Gradle
Write-Host "`n[7/7] Compiling Android APK via Gradle..." -ForegroundColor Cyan
Set-Location android

if ($IsWindows -or $env:OS -like "*Windows*") {
    if (Test-Path ".\gradlew.bat") {
        .\gradlew.bat assembleDebug
    } elseif (Test-Path ".\gradlew") {
        .\gradlew assembleDebug
    } else {
        Write-Warning "Could not find gradlew.bat, attempting global gradle command..."
        gradle assembleDebug
    }
} else {
    chmod +x gradlew
    ./gradlew assembleDebug
}

Set-Location ..

$ApkPath = "android/app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $ApkPath) {
    Copy-Item -Path $ApkPath -Destination "Unit_Price_Compare.apk" -Force
    Write-Host "`n==========================================" -ForegroundColor Green
    Write-Host " SUCCESS! APK Build Completed Successfully " -ForegroundColor Green
    Write-Host " APK File Output Path:" -ForegroundColor Green
    Write-Host " $(Resolve-Path $ApkPath)" -ForegroundColor Yellow
    Write-Host " Copied APK to root directory as:" -ForegroundColor Green
    Write-Host " Unit_Price_Compare.apk" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host "`n[!] Gradle process finished. Check android/app/build/outputs/apk/ for generated APK." -ForegroundColor Yellow
}
