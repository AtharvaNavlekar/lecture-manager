# Cleanup PowerShell Script for Orphaned Node.js Processes
# Run this if you encounter EADDRINUSE errors

Write-Host "🧹 Cleaning up Node.js processes on port 3000..." -ForegroundColor Yellow
Write-Host ""

try {
    # Find all processes using port 3000
    $processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique

    if ($processes) {
        Write-Host "Found $($processes.Count) process(es) using port 3000:" -ForegroundColor Cyan
        
        foreach ($pid in $processes) {
            try {
                $process = Get-Process -Id $pid -ErrorAction Stop
                Write-Host "  - PID $pid ($($process.ProcessName))" -ForegroundColor Gray
                
                # Kill the process
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "    ✅ Killed process $pid" -ForegroundColor Green
            }
            catch {
                Write-Host "    ⚠️  Could not kill process $pid: $_" -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "✅ Port 3000 cleanup complete!" -ForegroundColor Green
    }
    else {
        Write-Host "✅ No processes found using port 3000" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Error during cleanup: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative method: Kill all node processes" -ForegroundColor Yellow
    Write-Host "Run this command: Get-Process node | Stop-Process -Force" -ForegroundColor Gray
}

Write-Host ""
Write-Host "You can now start the server with: npm run dev" -ForegroundColor Cyan
Write-Host ""
