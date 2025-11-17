# Build all code executor Docker images
Write-Host "Building code executor Docker images..." -ForegroundColor Green

# Python
Write-Host "Building Python executor..." -ForegroundColor Yellow
docker build -t code-executor-python ./python

# Node.js (JavaScript, TypeScript, HTML, CSS)
Write-Host "Building Node.js executor..." -ForegroundColor Yellow
docker build -t code-executor-node ./node

# Java
Write-Host "Building Java executor..." -ForegroundColor Yellow
docker build -t code-executor-java ./java

# C++
Write-Host "Building C++ executor..." -ForegroundColor Yellow
docker build -t code-executor-cpp ./cpp

# C
Write-Host "Building C executor..." -ForegroundColor Yellow
docker build -t code-executor-c ./c

# Go
Write-Host "Building Go executor..." -ForegroundColor Yellow
docker build -t code-executor-go ./go

Write-Host ""
Write-Host "All Docker images built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify, run: docker images | Select-String code-executor" -ForegroundColor Cyan
