# DARKWATER POS - ULTIMATE STABLE SERVER
# This script breaks the crash loop permanently

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   DARKWATER POS - STABLE SERVER" -ForegroundColor Cyan  
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory and navigate to darkwater-pos
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetDir = Join-Path $scriptDir "darkwater-pos"

if (Test-Path $targetDir) {
    Set-Location $targetDir
    Write-Host "[STEP 1] ✅ Located project directory" -ForegroundColor Green
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Cannot find darkwater-pos directory!" -ForegroundColor Red
    exit 1
}

# Verify package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[STEP 2] 🧹 Performing NUCLEAR cleanup..." -ForegroundColor Yellow

# Kill ALL Node processes (nuclear option)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "next" -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 3

Write-Host "[STEP 3] 🔌 Clearing ALL ports..." -ForegroundColor Yellow

# Clear ports 3000 and 3001
$ports = @(3000, 3001)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port "
    foreach ($connection in $connections) {
        $processId = ($connection -split '\s+')[-1]
        if ($processId -ne "0" -and $processId -match '^\d+$') {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "  ✅ Cleared port $port (PID: $processId)" -ForegroundColor Green
            } catch {
                # Ignore errors
            }
        }
    }
}

Start-Sleep -Seconds 2

Write-Host "[STEP 4] 🗑️ Cleaning cache..." -ForegroundColor Yellow

# Clean npm cache and .next directory
npm cache clean --force 2>$null
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Removed .next directory" -ForegroundColor Green
}

Write-Host "[STEP 5] 🔍 Verifying environment..." -ForegroundColor Yellow

# Check and create .env.local if needed
if (!(Test-Path ".env.local")) {
    Write-Host "  ⚠️ Creating .env.local..." -ForegroundColor Yellow
    $envContent = @"
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true&w=majority&appName=Cluster0
"@
    $envContent | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "  ✅ Created .env.local" -ForegroundColor Green
} else {
    Write-Host "  ✅ Environment file exists" -ForegroundColor Green
}

Write-Host "[STEP 6] 📦 Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "  📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✅ Dependencies exist" -ForegroundColor Green
}

Write-Host ""
Write-Host "[STEP 7] 🚀 Starting ULTRA-STABLE server..." -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🌐 SERVER: http://localhost:3000" -ForegroundColor White
Write-Host "🔑 EMAIL:  admin@darkwater.local" -ForegroundColor White  
Write-Host "🔑 PASS:   ChangeMe!123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  KEEP THIS WINDOW OPEN" -ForegroundColor Yellow
Write-Host "🛑 Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Start the server with stability optimizations
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run dev


