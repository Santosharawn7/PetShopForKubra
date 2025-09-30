#!/bin/bash

echo "🐾 Starting Pet Shop Database..."
echo "================================="

# Clean up any existing containers first
echo "Cleaning up existing containers..."
docker-compose -f docker-compose.db.yml down 2>/dev/null || true
docker container prune -f >/dev/null 2>&1 || true

# Start only the database container
echo "Starting database container..."
docker-compose -f docker-compose.db.yml up -d

# Wait for database to be healthy
echo "⏳ Waiting for database to initialize..."
sleep 5

# Check if database is running
if docker-compose -f docker-compose.db.yml ps | grep -q "Up"; then
    echo "✅ Database started successfully!"
    echo ""
    echo "Database is running on: http://localhost:8080"
    echo "Database file location: ./docker/db/data/petshop.db"
    echo ""
    echo "To stop the database: docker-compose -f docker-compose.db.yml down"
    echo "To view database logs: docker-compose -f docker-compose.db.yml logs -f"
else
    echo "❌ Failed to start database. Check logs with: docker-compose -f docker-compose.db.yml logs"
    exit 1
fi
