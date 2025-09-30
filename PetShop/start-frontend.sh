#!/bin/bash

echo "🐾 Starting Pet Shop Frontend..."
echo "================================="

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the frontend
echo "Starting frontend development server..."
npm run dev
