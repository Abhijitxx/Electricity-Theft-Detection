#!/bin/bash
# Build script for Render deployment
# This script handles the complete build process for both backend and frontend

echo "🚀 Starting Electricity Theft Detection System Build..."

# Step 1: Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Step 2: Install Node.js dependencies and build frontend
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Node.js dependencies installed successfully"
else
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

echo "🔨 Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Failed to build frontend"
    exit 1
fi

cd ..

echo "✅ Build completed successfully!"
echo "🎉 Ready for deployment!"
