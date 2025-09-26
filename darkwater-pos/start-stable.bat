@echo off
echo 🚀 Starting Darkwater POS Server (Stable Mode)...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the darkwater-pos directory.
    pause
    exit /b 1
)

REM Kill any existing Node processes
echo 🔄 Stopping any existing Node processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Start server
echo 🌐 Starting Next.js development server...
echo 📍 Server will be available at: http://localhost:3000
echo ⚠️  Press Ctrl+C to stop the server
echo.

REM Set environment variables for stability
set NEXT_TELEMETRY_DISABLED=1
set NODE_ENV=development

REM Start the server
npm run dev

pause

