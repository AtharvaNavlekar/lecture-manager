@echo off
echo 🚀 Starting Lecture Manager System with PM2...
echo.

:: Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PM2 not found. Installing PM2...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install PM2. Please install manually: npm install -g pm2
        pause
        exit /b 1
    )
)

:: Clean up any existing processes on port 3000
echo 🧹 Cleaning up existing processes...
powershell -ExecutionPolicy Bypass -File scripts\cleanup-processes.ps1

:: Stop any existing PM2 instances
echo 🛑 Stopping existing PM2 instances...
call pm2 delete lecture-manager-api 2>nul

:: Wait a moment for cleanup
timeout /t 2 /nobreak >nul

:: Start server with PM2
echo 🔄 Starting server...
cd server
call pm2 start ..\ecosystem.config.js
cd ..

:: Wait for server to be ready
echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak >nul

:: Check server status
call pm2 status

:: Start client in a new window
echo 🎨 Starting client...
cd client
start "Lecture Manager Client" cmd /k "npm run dev"
cd ..

echo.
echo ✅ System started successfully!
echo.
echo 📊 Server Dashboard: http://localhost:3000
echo 🎨 Client Dashboard: http://localhost:5173
echo.
echo 💡 Useful Commands:
echo    pm2 logs           - View logs
echo    pm2 monit          - Monitor processes
echo    pm2 restart all    - Restart server
echo    pm2 stop all       - Stop all processes
echo    pm2 delete all     - Remove all processes
echo.

pause
