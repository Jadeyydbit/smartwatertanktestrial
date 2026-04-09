# Development startup script for Windows

Write-Host "🚀 Starting Smart Water Tank Backend and Frontend..." -ForegroundColor Green

# Kill any existing Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# Start Backend
Write-Host "📦 Starting Backend on port 3000..." -ForegroundColor Cyan
$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $backendPath "backend"
Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/K", "cd /d `"$backendPath`" && npm start"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "⚛️  Starting Frontend on port 5173..." -ForegroundColor Cyan
$frontendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $frontendPath "water-level-frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/K", "cd /d `"$frontendPath`" && npm run dev"

Write-Host ""
Write-Host "✅ Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "✅ Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in both windows to stop servers" -ForegroundColor Yellow
