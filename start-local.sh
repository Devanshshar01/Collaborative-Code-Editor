#!/bin/bash

echo "🚀 Starting Collaborative Code Editor..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if MongoDB is running
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" &> /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Attempting to start..."
        if command -v brew &> /dev/null; then
            brew services start mongodb-community
        else
            echo "❌ Please start MongoDB manually"
            exit 1
        fi
    fi
else
    echo "⚠️  MongoDB CLI (mongosh) not found. Make sure MongoDB is running."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
fi

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Start the server
echo ""
echo "🎉 Starting server in development mode..."
echo ""
echo "Servers will be available at:"
echo "  - Socket.IO: http://localhost:4000"
echo "  - Yjs WebSocket: ws://localhost:1234"
echo "  - Health Check: http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev:yjs