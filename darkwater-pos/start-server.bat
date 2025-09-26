@echo off
echo Starting Darkwater POS Server...
cd /d "%~dp0"
echo Current directory: %CD%
echo.
echo Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul >nul
timeout /t 2 /nobreak >nul
echo.
echo Starting Next.js development server...
echo Server will be available at: http://localhost:3000
echo Login: admin@darkwater.local / ChangeMe!123
echo.
echo Press Ctrl+C to stop the server
echo ================================
npm run dev
pause