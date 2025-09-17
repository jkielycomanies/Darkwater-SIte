@echo off
echo ========================================
echo    DARKWATER POS SERVER LAUNCHER
echo ========================================
echo.
echo Navigating to correct directory...
cd /d "%~dp0darkwater-pos"
echo Current directory: %CD%
echo.

REM Check if we're in the right place
if not exist "package.json" (
    echo ERROR: Cannot find package.json
    echo Are you sure this script is in the Darkwater-Site folder?
    echo Expected structure:
    echo   Darkwater-Site\
    echo     START-DARKWATER-SERVER.bat  ^(this file^)
    echo     darkwater-pos\
    echo       package.json
    echo.
    pause
    exit /b 1
)

echo ✅ Found package.json - we're in the right directory!
echo.
echo Cleaning up any existing Node processes...
taskkill /F /IM node.exe 2>nul >nul
echo.
echo Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo Killing process %%a on port 3000
    taskkill /F /PID %%a 2>nul >nul
)
timeout /t 2 /nobreak >nul
echo.
echo Starting Darkwater POS development server...
echo.
echo 🌐 Server will be available at: http://localhost:3000
echo 🔑 Login credentials:
echo    Email: admin@darkwater.local
echo    Password: ChangeMe!123
echo.
echo ⚠️  IMPORTANT: Keep this window open while using the application
echo 🛑 Press Ctrl+C to stop the server
echo.
echo ========================================
npm run dev


