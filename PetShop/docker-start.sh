#!/bin/bash

# Pet Shop Docker Quick Start Script

echo "🐾 Starting Pet Shop Application with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Build and start the application
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Application is running successfully!"
    echo ""
    echo "🌐 Access the application:"
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:5000"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop application: docker-compose down"
    echo ""
else
    echo "❌ Failed to start application. Check logs with: docker-compose logs"
    exit 1
fi



