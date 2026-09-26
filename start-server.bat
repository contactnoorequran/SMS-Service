@echo off
title SMS Service - Server
cd /d "%~dp0"

echo =====================================================================
echo                 SMS SERVICE - 1-CLICK LAUNCHER
echo =====================================================================
echo.
echo  [1/2] Starting Unified Server (Express API + Vite React Frontend)...
echo  [2/2] Opening browser at http://localhost:3000...
echo.

:: Open default browser after 3 seconds in the background
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start the live server
npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server stopped with error code %ERRORLEVEL%.
    pause
)
