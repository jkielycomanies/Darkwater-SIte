@echo off
echo Resetting Darkwater POS Project...
cd /d "%~dp0"
echo.
echo 1. Stopping all Node processes...
taskkill /F /IM node.exe 2>nul >nul
echo.
echo 2. Clearing npm cache...
npm cache clean --force
echo.
echo 3. Removing node_modules...
if exist node_modules rmdir /s /q node_modules
echo.
echo 4. Removing .next directory...
if exist .next rmdir /s /q .next
echo.
echo 5. Reinstalling dependencies...
npm install
echo.
echo 6. Project reset complete!
echo You can now run START-SERVER.bat
pause


