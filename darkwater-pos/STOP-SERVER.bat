@echo off
echo Stopping Darkwater POS Server...
echo.
echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
echo.
echo Clearing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)
echo.
echo Server stopped successfully!
pause


