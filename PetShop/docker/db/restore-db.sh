#!/bin/bash

# Pet Shop SQLite Database Restore Script

if [ -z "$1" ]; then
    echo "❌ Please provide a backup file path"
    echo "Usage: ./restore-db.sh <backup_file.db>"
    echo ""
    echo "Available backups:"
    ls -la backups/*.db 2>/dev/null || echo "No backups found in backups/ directory"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🐾 Restoring Pet Shop SQLite Database from: $BACKUP_FILE"

# Check if database container is running
if ! docker ps | grep -q "petshop-sqlite"; then
    echo "❌ Database container is not running. Start it first with: ./start-db.sh"
    exit 1
fi

# Stop the container temporarily
echo "⏸️  Stopping database container..."
docker-compose down

# Start container without the database file
echo "🔄 Starting container..."
docker-compose up -d

# Wait a moment for container to start
sleep 3

# Copy backup file to container
echo "📦 Restoring database..."
docker cp "$BACKUP_FILE" petshop-sqlite:/data/petshop.db

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    echo "📊 Restored from: $BACKUP_FILE"
    echo "💡 Database is now running with restored data"
else
    echo "❌ Restore failed!"
    exit 1
fi



