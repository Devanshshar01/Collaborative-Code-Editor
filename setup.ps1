#!/usr/bin/env powershell
# Collaborative Editor Setup Script for Windows

Write-Host "🚀 Collaborative Editor Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Node.js check
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# npm check
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
} else {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# MongoDB check
if (Test-Command "mongosh") {
    Write-Host "✅ MongoDB shell detected" -ForegroundColor Green
    
    # Test MongoDB connection
    try {
        $mongoTest = mongosh --eval "db.version()" --quiet 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB server is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  MongoDB server not running" -ForegroundColor Yellow
            Write-Host "   Attempting to start MongoDB service..." -ForegroundColor Yellow
            
            try {
                net start MongoDB
                Write-Host "✅ MongoDB service started" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to start MongoDB service" -ForegroundColor Red
                Write-Host "   Please start MongoDB manually or use Docker option" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "⚠️  Could not test MongoDB connection" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ MongoDB not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 MongoDB Installation Options:" -ForegroundColor Cyan
    Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest" -ForegroundColor White
    Write-Host "3. Use cloud: MongoDB Atlas (https://cloud.mongodb.com/)" -ForegroundColor White
    Write-Host ""
    
    $installChoice = Read-Host "Would you like to continue without MongoDB? (y/N)"
    if ($installChoice -ne "y" -and $installChoice -ne "Y") {
        Write-Host "Setup cancelled. Please install MongoDB and run again." -ForegroundColor Red
        exit 1
    }
}

# Docker check (optional)
if (Test-Command "docker") {
    $dockerVersion = docker --version
    Write-Host "✅ Docker $dockerVersion detected" -ForegroundColor Green
    
    # Offer MongoDB via Docker if MongoDB not installed
    if (-not (Test-Command "mongosh")) {
        Write-Host ""
        $dockerMongo = Read-Host "Would you like to install MongoDB via Docker? (y/N)"
        if ($dockerMongo -eq "y" -or $dockerMongo -eq "Y") {
            Write-Host "🐳 Starting MongoDB container..." -ForegroundColor Cyan
            
            try {
                docker run -d -p 27017:27017 --name mongodb-collab mongo:latest
                Start-Sleep -Seconds 5
                Write-Host "✅ MongoDB container started successfully" -ForegroundColor Green
                Write-Host "   MongoDB will be available at mongodb://localhost:27017" -ForegroundColor White
            } catch {
                Write-Host "❌ Failed to start MongoDB container" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "⚠️  Docker not installed (optional)" -ForegroundColor Yellow
    Write-Host "   Download from: https://desktop.docker.com/" -ForegroundColor White
}

Write-Host ""
Write-Host "📦 Installing npm dependencies..." -ForegroundColor Cyan

# Install dependencies
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Security audit
Write-Host ""
Write-Host "🔒 Running security audit..." -ForegroundColor Cyan
npm audit

Write-Host ""
$fixVulnerabilities = Read-Host "Would you like to fix security vulnerabilities? (y/N)"
if ($fixVulnerabilities -eq "y" -or $fixVulnerabilities -eq "Y") {
    Write-Host "🔧 Fixing vulnerabilities..." -ForegroundColor Cyan
    npm audit fix
    
    Write-Host ""
    Write-Host "⚠️  Some vulnerabilities may require manual updates:" -ForegroundColor Yellow
    Write-Host "   - TLDraw: Major version update available (may break compatibility)" -ForegroundColor White
    Write-Host "   - jsPDF: Update available (may break PDF export)" -ForegroundColor White
}

# Build project
Write-Host ""
Write-Host "🔨 Building TypeScript project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "Check the error messages above and fix any TypeScript issues" -ForegroundColor Yellow
    exit 1
}

# Create environment file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Environment file created" -ForegroundColor Green
    Write-Host "   Review and update .env file with your configuration" -ForegroundColor White
}

# Final status
Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Review .env file configuration" -ForegroundColor White
Write-Host "2. Start the server: npm run dev:yjs" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:4000" -ForegroundColor White
Write-Host "4. Test features: code editing, video, whiteboard" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Servers will run on:" -ForegroundColor Cyan
Write-Host "- Socket.IO: http://localhost:4000" -ForegroundColor White
Write-Host "- Yjs WebSocket: ws://localhost:1234" -ForegroundColor White
Write-Host "- Health Check: http://localhost:4000/health" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- README.md - Full documentation" -ForegroundColor White
Write-Host "- QUICKSTART.md - Quick start guide" -ForegroundColor White
Write-Host "- WHITEBOARD_GUIDE.md - Whiteboard features" -ForegroundColor White
Write-Host "- WEBRTC_TROUBLESHOOTING.md - Video call debugging" -ForegroundColor White
Write-Host ""

$startNow = Read-Host "Would you like to start the server now? (y/N)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    npm run dev:yjs
}