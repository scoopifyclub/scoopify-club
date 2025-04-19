# Official ScoopifyClub Development Server Launcher
Write-Host "Starting ScoopifyClub Development Server..." -ForegroundColor Cyan

# Kill existing Node.js processes
Write-Host "Killing existing Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

# Clear port 3000 if it's in use
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    $pid = ($port3000 -split '\s+')[-1]
    taskkill /F /PID $pid 2>$null
}

# Generate Prisma client and run migrations
Write-Host "Setting up database..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Start Prisma Studio
Write-Host "Starting Prisma Studio..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx prisma studio --port 5555"

# Start the development server
Write-Host "Starting Next.js development server..." -ForegroundColor Green
Write-Host "The application will be available at: http://localhost:3000" -ForegroundColor Cyan
npx next dev 