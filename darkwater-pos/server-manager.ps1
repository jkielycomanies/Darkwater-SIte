# Robust Server Management Script for Darkwater POS
# This script provides stable server startup with proper cleanup

param(
    [string]$Action = "start",
    [int]$Port = 3000
)

function Stop-NodeProcesses {
    Write-Host "🛑 Stopping all Node.js processes..." -ForegroundColor Yellow
    
    # Kill all node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Kill processes using port 3000
    $portProcesses = netstat -ano | Select-String ":$Port " | ForEach-Object {
        $processId = ($_ -split '\s+')[-1]
        if ($processId -ne "0") {
            try {
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "✅ Killed process $processId using port $Port"
            } catch {
                Write-Host "⚠️ Could not kill process $processId"
            }
        }
    }
    
    Start-Sleep -Seconds 2
}

function Start-Server {
    Write-Host "🚀 Starting Darkwater POS server..." -ForegroundColor Green
    
    # Navigate to correct directory
    Set-Location "C:\Users\jkiel\OneDrive\Desktop\Darkwater-Site\darkwater-pos"
    
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Host "❌ Error: Not in correct directory. package.json not found." -ForegroundColor Red
        exit 1
    }
    
    # Clean npm cache
    Write-Host "🧹 Cleaning npm cache..."
    npm cache clean --force 2>$null
    
    # Install dependencies if needed
    if (!(Test-Path "node_modules")) {
        Write-Host "📦 Installing dependencies..."
        npm install
    }
    
    # Start the server
    Write-Host "✨ Starting Next.js development server..."
    npm run dev
}

function Test-Server {
    Start-Sleep -Seconds 5
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/api/auth/session" -TimeoutSec 10
        Write-Host "✅ Server is responding on port $Port" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Server is not responding on port $Port" -ForegroundColor Red
        return $false
    }
}

function Restart-Server {
    Write-Host "🔄 Restarting server..." -ForegroundColor Cyan
    Stop-NodeProcesses
    Start-Server
}

function Show-Status {
    Write-Host "📊 Server Status:" -ForegroundColor Cyan
    
    # Check for Node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "🟢 Node.js processes running: $($nodeProcesses.Count)"
        $nodeProcesses | ForEach-Object { Write-Host "   PID: $($_.Id)" }
    } else {
        Write-Host "🔴 No Node.js processes found"
    }
    
    # Check port usage
    $portUsage = netstat -ano | Select-String ":$Port "
    if ($portUsage) {
        Write-Host "🟢 Port $Port is in use:"
        $portUsage | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "🔴 Port $Port is not in use"
    }
    
    # Test server response
    Test-Server
}

# Main execution
switch ($Action.ToLower()) {
    "start" { 
        Stop-NodeProcesses
        Start-Server 
    }
    "stop" { 
        Stop-NodeProcesses 
        Write-Host "✅ Server stopped" -ForegroundColor Green
    }
    "restart" { 
        Restart-Server 
    }
    "status" { 
        Show-Status 
    }
    default { 
        Write-Host "Usage: .\server-manager.ps1 [start|stop|restart|status]" -ForegroundColor Yellow
        Write-Host "Default action is 'start'"
    }
}


