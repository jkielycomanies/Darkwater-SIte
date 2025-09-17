@echo off
color 0A
title DARKWATER POS - Ultimate Stable Server

echo.
echo =========================================================
echo           DARKWATER POS - ULTIMATE STABLE SERVER
echo =========================================================
echo.

REM Navigate to correct directory
cd /d "%~dp0darkwater-pos"

REM Verify we're in the right place
if not exist "package.json" (
    echo [ERROR] Cannot find package.json!
    echo Make sure this file is in the Darkwater-Site folder.
    pause
    exit /b 1
)

echo [STEP 1] ✅ Located project directory
echo Current directory: %CD%
echo.

REM Kill ALL Node processes (nuclear option)
echo [STEP 2] 🧹 Performing complete cleanup...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
taskkill /F /IM next.exe >nul 2>&1

REM Wait for processes to fully terminate
timeout /t 3 /nobreak >nul

REM Clear all ports that might conflict
echo [STEP 3] 🔌 Clearing all potential port conflicts...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " 2^>nul') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " 2^>nul') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Wait for ports to be freed
timeout /t 2 /nobreak >nul

REM Clean npm cache and temporary files
echo [STEP 4] 🗑️ Cleaning cache and temporary files...
npm cache clean --force >nul 2>&1
if exist ".next" rmdir /s /q ".next" >nul 2>&1
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" >nul 2>&1

REM Verify environment
echo [STEP 5] 🔍 Verifying environment...
if not exist ".env.local" (
    echo [WARNING] .env.local not found. Creating default...
    echo NEXTAUTH_SECRET=your-super-secret-key-here > .env.local
    echo NEXTAUTH_URL=http://localhost:3000 >> .env.local
    echo MONGODB_URI=mongodb+srv://jkiely2025:IDKLOL@cluster0.jxle3wm.mongodb.net/darkwater-pos?retryWrites=true^&w=majority^&appName=Cluster0 >> .env.local
    echo ✅ Created .env.local
) else (
    echo ✅ Environment file found
)

REM Check dependencies
echo [STEP 6] 📦 Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies already installed
)

echo.
echo [STEP 7] 🚀 Starting ULTRA-STABLE Next.js server...
echo.
echo =========================================================
echo   🌐 SERVER: http://localhost:3000
echo   🔑 EMAIL:  admin@darkwater.local  
echo   🔑 PASS:   ChangeMe!123
echo.
echo   ⚠️  KEEP THIS WINDOW OPEN WHILE USING THE APP
echo   🛑 Press Ctrl+C to stop the server
echo =========================================================
echo.

REM Start with stability flags
npm run dev -- --experimental-https false --keep-alive-timeout 0

echo.
echo [INFO] Server stopped. Press any key to exit.
pause >nul


