#!/bin/bash

# Pet Shop SQLite Database Docker Start Script

echo "🐾 Starting Pet Shop SQLite Database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start the database container
echo "🔨 Building and starting SQLite database container..."
docker-compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
sleep 5

# Check if database is running
if docker-compose ps | grep -q "Up"; then
    echo "✅ SQLite database is running successfully!"
    echo ""
    echo "📊 Database Information:"
    echo "   Container: petshop-sqlite"
    echo "   Database file: /data/petshop.db (persistent)"
    echo "   Volume: sqlite_data"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Access database: docker exec -it petshop-sqlite sqlite3 /data/petshop.db"
    echo "   Stop database: docker-compose down"
    echo "   Backup database: ./backup-db.sh"
    echo ""
    echo "💡 Your backend should now connect to the database file at:"
    echo "   /var/lib/docker/volumes/docker_sqlite_data/_data/petshop.db"
    echo "   (or use the volume mount path in your backend config)"
    echo ""
else
    echo "❌ Failed to start database. Check logs with: docker-compose logs"
    exit 1
fi



