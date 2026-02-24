@echo off
echo.
echo ========================================
echo   CLEARING BUILD CACHE
echo ========================================
echo.

REM Navigate to client directory if not already there
cd /d "%~dp0"

echo [1/4] Removing dist folder...
if exist "dist" (
    rmdir /s /q "dist"
    echo      ✓ dist removed
) else (
    echo      - dist not found
)

echo.
echo [2/4] Removing node_modules/.vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo      ✓ .vite cache removed
) else (
    echo      - .vite cache not found
)

echo.
echo [3/4] Clearing npm cache...
call npm cache clean --force >nul 2>&1
echo      ✓ npm cache cleared

echo.
echo [4/4] Rebuilding fresh...
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✓ CACHE CLEARED SUCCESSFULLY!
    echo ========================================
    echo.
    echo Next steps:
    echo   1. Restart the dev server: npm run dev
    echo   2. Hard refresh browser: Ctrl+Shift+R
    echo.
) else (
    echo.
    echo ========================================
    echo   ✗ BUILD FAILED
    echo ========================================
    echo.
)

pause
