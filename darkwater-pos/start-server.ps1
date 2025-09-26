# Darkwater POS - Robust Server Startup Script
# This script ensures stable server startup with proper error handling

Write-Host "Darkwater POS Server Startup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Function to check prerequisites
function Test-Prerequisites {
    Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow
    
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Host "Error: package.json not found. Please run this script from the darkwater-pos directory." -ForegroundColor Red
        exit 1
    }
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "Error: Node.js not found. Please install Node.js." -ForegroundColor Red
        exit 1
    }
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version
        Write-Host "npm version: $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "Error: npm not found. Please install npm." -ForegroundColor Red
        exit 1
    }
    
    # Check environment file
    if (Test-Path ".env.local") {
        Write-Host "Environment file found" -ForegroundColor Green
    } else {
        Write-Host "Error: .env.local not found. Please create environment file." -ForegroundColor Red
        exit 1
    }
}

# Function to clean up existing processes
function Clear-ExistingProcesses {
    Write-Host "`nCleaning up existing processes..." -ForegroundColor Yellow
    
    # Stop any existing Node.js processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Stopping $($nodeProcesses.Count) existing Node.js process(es)..."
        $nodeProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "Existing processes stopped" -ForegroundColor Green
    } else {
        Write-Host "No existing Node.js processes found" -ForegroundColor Green
    }
    
    # Clear port 3000 if it's in use
    $portProcesses = netstat -ano | Select-String ":3000 " | ForEach-Object {
        $processId = ($_ -split '\s+')[-1]
        if ($processId -ne "0" -and $processId -match '^\d+$') {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "Cleared port 3000 (PID: $processId)" -ForegroundColor Green
            } catch {
                Write-Host "Could not clear process $processId" -ForegroundColor Yellow
            }
        }
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
    
    if (!(Test-Path "node_modules")) {
        Write-Host "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: npm install failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "Dependencies already installed" -ForegroundColor Green
    }
}

# Function to test database connection (simplified)
function Test-DatabaseConnection {
    Write-Host "`nTesting database connection..." -ForegroundColor Yellow
    
    # Simple environment check
    if (!(Test-Path ".env.local")) {
        Write-Host "Environment file not found" -ForegroundColor Red
        exit 1
    }
    
    # Check if MONGODB_URI exists in .env.local
    $envContent = Get-Content ".env.local"
    $hasMongoUri = $envContent | Where-Object { $_ -match "MONGODB_URI" }
    
    if ($hasMongoUri) {
        Write-Host "MongoDB URI found in environment" -ForegroundColor Green
    } else {
        Write-Host "MONGODB_URI not found in .env.local" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Note: Full database connection test skipped for stability" -ForegroundColor Yellow
    Write-Host "Database will be tested when the server starts" -ForegroundColor Yellow
}

# Function to start the server
function Start-DevelopmentServer {
    Write-Host "`nStarting development server..." -ForegroundColor Yellow
    
    # Clear npm cache
    npm cache clean --force 2>$null
    
    Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
    Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Login with: admin@darkwater.local / ChangeMe!123" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Cyan
    
    # Start the server
    npm run dev
}

# Main execution
try {
    Test-Prerequisites
    Clear-ExistingProcesses
    Install-Dependencies
    Test-DatabaseConnection
    Start-DevelopmentServer
} catch {
    Write-Host "`nStartup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}













