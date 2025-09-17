@echo off
echo ========================================
echo    DARKWATER POS SERVER STOPPER
echo ========================================
echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
echo.
echo Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo Killing process %%a on port 3000
    taskkill /F /PID %%a 2>nul
)
echo.
echo ✅ Darkwater POS Server stopped successfully!
echo.
pause


