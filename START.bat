@echo off
echo.
echo ========================================
echo   LECTURE MANAGER - CLEAN START
echo ========================================
echo.

echo [1/3] Killing old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend Server...
cd server
start "Backend Server" cmd /k "npm start"

timeout /t 8 /nobreak >nul

echo [3/3] Starting Frontend Client...
cd ..\client
start "Frontend Client" cmd /k "npm run dev"

echo.
echo ========================================
echo   SERVERS STARTING...
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Wait 10 seconds then visit:
echo http://localhost:5173
echo.
echo Press any key to exit this window...
pause >nul
