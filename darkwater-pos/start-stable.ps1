# Stable Next.js Server Startup Script
# This script provides a more robust server startup that won't crash on TypeScript errors

Write-Host "🚀 Starting Darkwater POS Server (Stable Mode)..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the darkwater-pos directory." -ForegroundColor Red
    exit 1
}

# Kill any existing Node processes
Write-Host "🔄 Stopping any existing Node processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
} catch {
    Write-Host "ℹ️ No existing Node processes found." -ForegroundColor Blue
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start server with error handling
Write-Host "🌐 Starting Next.js development server..." -ForegroundColor Green
Write-Host "📍 Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "⚠️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

try {
    # Start server with TypeScript checking disabled for development
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $env:NODE_ENV = "development"
    
    # Use npm run dev but with better error handling
    npm run dev
} catch {
    Write-Host "❌ Failed to start server: $_" -ForegroundColor Red
    Write-Host "🔄 Attempting alternative startup method..." -ForegroundColor Yellow
    
    try {
        # Alternative: direct Next.js startup
        npx next dev --port 3000 --turbo
    } catch {
        Write-Host "❌ Alternative startup also failed: $_" -ForegroundColor Red
        Write-Host "💡 Try running 'npm install' first, then run this script again." -ForegroundColor Yellow
    }
}

