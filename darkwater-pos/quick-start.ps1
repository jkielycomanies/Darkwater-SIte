# Darkwater POS - Simple Robust Startup
Write-Host "Starting Darkwater POS Server..." -ForegroundColor Cyan

# Kill existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "Error: Not in correct directory. Please navigate to darkwater-pos folder." -ForegroundColor Red
    exit 1
}

# Check environment file
if (!(Test-Path ".env.local")) {
    Write-Host "Warning: .env.local not found. Creating from template..." -ForegroundColor Yellow
    $envContent = @"
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true&w=majority&appName=Cluster0
"@
    $envContent | Out-File -FilePath ".env.local" -Encoding utf8
    Write-Host "Created .env.local file" -ForegroundColor Green
}

Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Login: admin@darkwater.local / ChangeMe!123" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan

npm run dev


