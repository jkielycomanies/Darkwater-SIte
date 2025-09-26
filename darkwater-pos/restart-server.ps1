# Server Restart Script - Safe restart without crashes
Write-Host "🔄 Restarting Darkwater POS Server..." -ForegroundColor Yellow

# Stop existing server
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Stopped existing server" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "ℹ️ No existing server to stop" -ForegroundColor Blue
}

# Start new server
Write-Host "🚀 Starting new server..." -ForegroundColor Green
try {
    npm run dev:no-check
} catch {
    Write-Host "❌ Failed to start with no-check, trying regular dev..." -ForegroundColor Red
    try {
        npm run dev
    } catch {
        Write-Host "❌ All startup methods failed" -ForegroundColor Red
    }
}

