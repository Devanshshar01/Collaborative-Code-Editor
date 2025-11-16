#!/usr/bin/env powershell
# MongoDB Installation Helper for Windows

Write-Host "🗄️ MongoDB Installation Helper" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is already installed
if (Get-Command "mongosh" -ErrorAction SilentlyContinue) {
    Write-Host "✅ MongoDB is already installed!" -ForegroundColor Green
    
    try {
        $mongoVersion = mongosh --eval "db.version()" --quiet
        Write-Host "   Version: $mongoVersion" -ForegroundColor White
        
        # Test connection
        $mongoTest = mongosh --eval "db.serverStatus()" --quiet 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ MongoDB server is running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  MongoDB service not running" -ForegroundColor Yellow
            
            $startService = Read-Host "Would you like to start the MongoDB service? (y/N)"
            if ($startService -eq "y" -or $startService -eq "Y") {
                try {
                    net start MongoDB
                    Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Failed to start MongoDB service" -ForegroundColor Red
                    Write-Host "   You may need to run this as Administrator" -ForegroundColor Yellow
                }
            }
        }
    } catch {
        Write-Host "⚠️  Could not determine MongoDB status" -ForegroundColor Yellow
    }
    
    exit 0
}

Write-Host "❌ MongoDB not found. Let's install it!" -ForegroundColor Red
Write-Host ""

# Installation options
Write-Host "📋 Choose installation method:" -ForegroundColor Cyan
Write-Host "1. Official MongoDB installer (Recommended)" -ForegroundColor White
Write-Host "2. Docker container (Easiest)" -ForegroundColor White
Write-Host "3. MongoDB Atlas cloud (No local install)" -ForegroundColor White
Write-Host "4. Chocolatey package manager" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Official MongoDB Installation" -ForegroundColor Cyan
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Download MongoDB Community Edition from:" -ForegroundColor Yellow
        Write-Host "   https://www.mongodb.com/try/download/community" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Choose Windows x64 MSI installer" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "3. During installation:" -ForegroundColor Yellow
        Write-Host "   - Check 'Install MongoDB as a Service'" -ForegroundColor White
        Write-Host "   - Check 'Install MongoDB Compass' (optional GUI)" -ForegroundColor White
        Write-Host ""
        Write-Host "4. After installation, MongoDB will start automatically" -ForegroundColor Yellow
        Write-Host ""
        
        $openBrowser = Read-Host "Open download page in browser? (y/N)"
        if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
            Start-Process "https://www.mongodb.com/try/download/community"
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🐳 Docker MongoDB Installation" -ForegroundColor Cyan
        Write-Host "==============================" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Docker is installed
        if (Get-Command "docker" -ErrorAction SilentlyContinue) {
            Write-Host "✅ Docker detected, installing MongoDB..." -ForegroundColor Green
            
            try {
                # Pull and run MongoDB container
                Write-Host "📥 Pulling MongoDB image..." -ForegroundColor Yellow
                docker pull mongo:latest
                
                Write-Host "🚀 Starting MongoDB container..." -ForegroundColor Yellow
                docker run -d `
                    --name mongodb-collab `
                    -p 27017:27017 `
                    -e MONGO_INITDB_ROOT_USERNAME=admin `
                    -e MONGO_INITDB_ROOT_PASSWORD=password `
                    mongo:latest
                
                Start-Sleep -Seconds 10
                
                # Test container
                $containerStatus = docker ps --filter "name=mongodb-collab" --format "table {{.Status}}"
                if ($containerStatus -match "Up") {
                    Write-Host "✅ MongoDB container started successfully!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "📋 Connection details:" -ForegroundColor Cyan
                    Write-Host "   Host: localhost" -ForegroundColor White
                    Write-Host "   Port: 27017" -ForegroundColor White
                    Write-Host "   Username: admin" -ForegroundColor White
                    Write-Host "   Password: password" -ForegroundColor White
                    Write-Host ""
                    Write-Host "Update your .env file:" -ForegroundColor Yellow
                    Write-Host "   MONGODB_URI=mongodb://admin:password@localhost:27017/collaborative_editor?authSource=admin" -ForegroundColor White
                } else {
                    Write-Host "❌ Failed to start MongoDB container" -ForegroundColor Red
                }
            } catch {
                Write-Host "❌ Error starting MongoDB container: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Docker not installed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Please install Docker Desktop first:" -ForegroundColor Yellow
            Write-Host "1. Download: https://desktop.docker.com/" -ForegroundColor White
            Write-Host "2. Install and restart computer" -ForegroundColor White
            Write-Host "3. Run this script again" -ForegroundColor White
            
            $openDocker = Read-Host "Open Docker download page? (y/N)"
            if ($openDocker -eq "y" -or $openDocker -eq "Y") {
                Start-Process "https://desktop.docker.com/"
            }
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "☁️ MongoDB Atlas Cloud Setup" -ForegroundColor Cyan
        Write-Host "=============================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Create free account at MongoDB Atlas:" -ForegroundColor Yellow
        Write-Host "   https://cloud.mongodb.com/" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Create a new cluster (M0 is free)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "3. Create database user:" -ForegroundColor Yellow
        Write-Host "   - Database Access → Add New Database User" -ForegroundColor White
        Write-Host "   - Choose username/password authentication" -ForegroundColor White
        Write-Host ""
        Write-Host "4. Allow network access:" -ForegroundColor Yellow
        Write-Host "   - Network Access → Add IP Address" -ForegroundColor White
        Write-Host "   - Allow access from anywhere: 0.0.0.0/0" -ForegroundColor White
        Write-Host ""
        Write-Host "5. Get connection string:" -ForegroundColor Yellow
        Write-Host "   - Clusters → Connect → Connect your application" -ForegroundColor White
        Write-Host "   - Copy the connection string" -ForegroundColor White
        Write-Host ""
        Write-Host "6. Update .env file with your connection string" -ForegroundColor Yellow
        Write-Host ""
        
        $openAtlas = Read-Host "Open MongoDB Atlas in browser? (y/N)"
        if ($openAtlas -eq "y" -or $openAtlas -eq "Y") {
            Start-Process "https://cloud.mongodb.com/"
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "🍫 Chocolatey MongoDB Installation" -ForegroundColor Cyan
        Write-Host "===================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Check if Chocolatey is installed
        if (Get-Command "choco" -ErrorAction SilentlyContinue) {
            Write-Host "✅ Chocolatey detected, installing MongoDB..." -ForegroundColor Green
            
            try {
                choco install mongodb -y
                
                Write-Host "✅ MongoDB installed via Chocolatey!" -ForegroundColor Green
                Write-Host "   Starting MongoDB service..." -ForegroundColor Yellow
                
                net start MongoDB
                Write-Host "✅ MongoDB service started" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to install MongoDB via Chocolatey" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Chocolatey not installed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Install Chocolatey first:" -ForegroundColor Yellow
            Write-Host "1. Run PowerShell as Administrator" -ForegroundColor White
            Write-Host "2. Run: Set-ExecutionPolicy Bypass -Scope Process -Force" -ForegroundColor White
            Write-Host "3. Run: iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" -ForegroundColor White
            Write-Host "4. Run this script again" -ForegroundColor White
        }
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 Next Steps After MongoDB Installation:" -ForegroundColor Cyan
Write-Host "1. Test MongoDB connection: mongosh --eval 'db.version()'" -ForegroundColor White
Write-Host "2. Update .env file if needed" -ForegroundColor White
Write-Host "3. Run the collaborative editor: npm run dev:yjs" -ForegroundColor White
Write-Host "4. Test at: http://localhost:4000/health" -ForegroundColor White
Write-Host ""

Write-Host "📚 For more help, see:" -ForegroundColor Cyan
Write-Host "- README.md" -ForegroundColor White
Write-Host "- DEPENDENCY_STATUS.md" -ForegroundColor White
Write-Host "- QUICKSTART.md" -ForegroundColor White