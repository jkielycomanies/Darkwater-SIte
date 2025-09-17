# Darkwater POS - Universal Server Launcher
# This script works from any directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    DARKWATER POS SERVER LAUNCHER" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory and navigate to darkwater-pos
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetDir = Join-Path $scriptDir "darkwater-pos"

Write-Host "Script location: $scriptDir" -ForegroundColor Yellow
Write-Host "Target directory: $targetDir" -ForegroundColor Yellow

if (Test-Path $targetDir) {
    Set-Location $targetDir
    Write-Host "✅ Successfully navigated to darkwater-pos directory" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Cannot find darkwater-pos directory!" -ForegroundColor Red
    Write-Host "Expected structure:" -ForegroundColor Yellow
    Write-Host "  Darkwater-Site\" -ForegroundColor Yellow
    Write-Host "    run-darkwater.ps1 (this file)" -ForegroundColor Yellow
    Write-Host "    darkwater-pos\" -ForegroundColor Yellow
    Write-Host "      package.json" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ ERROR: package.json not found in darkwater-pos directory!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found package.json - we're in the right place!" -ForegroundColor Green
Write-Host ""

# Kill existing Node processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear port 3000
Write-Host "🔌 Clearing port 3000..." -ForegroundColor Yellow
$portProcesses = netstat -ano | Select-String ":3000 " | ForEach-Object {
    $processId = ($_ -split '\s+')[-1]
    if ($processId -ne "0" -and $processId -match '^\d+$') {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Killed process $processId on port 3000" -ForegroundColor Green
        } catch {
            # Ignore errors
        }
    }
}

Write-Host ""
Write-Host "🚀 Starting Darkwater POS development server..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔑 Login credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@darkwater.local" -ForegroundColor White
Write-Host "   Password: ChangeMe!123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open while using the application" -ForegroundColor Yellow
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Start the server
npm run dev


