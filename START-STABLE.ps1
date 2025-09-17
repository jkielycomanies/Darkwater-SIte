# DARKWATER POS - BULLETPROOF SERVER STARTER

Write-Host "DARKWATER POS - STABLE SERVER STARTUP" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Navigate to darkwater-pos
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetDir = Join-Path $scriptDir "darkwater-pos"
Set-Location $targetDir

Write-Host "Step 1: Killing all Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Step 2: Clearing port 3000..." -ForegroundColor Yellow
$portProcesses = netstat -ano | Select-String ":3000"
foreach ($process in $portProcesses) {
    $pid = ($process -split '\s+')[-1]
    if ($pid -match '^\d+$' -and $pid -ne "0") {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

Write-Host "Step 3: Cleaning cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null

Write-Host "Step 4: Starting server..." -ForegroundColor Green
Write-Host ""
Write-Host "SERVER: http://localhost:3000" -ForegroundColor Cyan
Write-Host "LOGIN: admin@darkwater.local / ChangeMe!123" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev


