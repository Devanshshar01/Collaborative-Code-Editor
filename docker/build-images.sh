#!/bin/bash

# Build all code executor Docker images
echo "Building code executor Docker images..."

# Python
echo "Building Python executor..."
docker build -t code-executor-python ./python

# Node.js (JavaScript, TypeScript, HTML, CSS)
echo "Building Node.js executor..."
docker build -t code-executor-node ./node

# Java
echo "Building Java executor..."
docker build -t code-executor-java ./java

# C++
echo "Building C++ executor..."
docker build -t code-executor-cpp ./cpp

# C
echo "Building C executor..."
docker build -t code-executor-c ./c

# Go
echo "Building Go executor..."
docker build -t code-executor-go ./go

echo "All Docker images built successfully!"
echo ""
echo "To verify, run: docker images | grep code-executor"
