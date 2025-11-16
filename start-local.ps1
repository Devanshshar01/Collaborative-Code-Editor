Write-Host "🚀 Starting Collaborative Code Editor..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js v16 or higher." -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
try {
    $mongoTest = mongosh --eval "db.version()" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB is not running. Please start MongoDB manually." -ForegroundColor Yellow
        Write-Host "   You can start MongoDB with: net start MongoDB" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  MongoDB CLI (mongosh) not found. Make sure MongoDB is installed and running." -ForegroundColor Yellow
}

# Install dependencies if node_modules doesn't exist
if (-Not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Build TypeScript
Write-Host ""
Write-Host "🔨 Building TypeScript..." -ForegroundColor Cyan
npm run build

# Start the server
Write-Host ""
Write-Host "🎉 Starting server in development mode..." -ForegroundColor Green
Write-Host ""
Write-Host "Servers will be available at:" -ForegroundColor Cyan
Write-Host "  - Socket.IO: http://localhost:4000" -ForegroundColor White
Write-Host "  - Yjs WebSocket: ws://localhost:1234" -ForegroundColor White
Write-Host "  - Health Check: http://localhost:4000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run dev:yjs