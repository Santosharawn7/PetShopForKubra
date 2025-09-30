#!/bin/bash

# Pet Shop SQLite Database Backup Script

echo "🐾 Backing up Pet Shop SQLite Database..."

# Check if database container is running
if ! docker ps | grep -q "petshop-sqlite"; then
    echo "❌ Database container is not running. Start it first with: ./start-db.sh"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate backup filename with timestamp
BACKUP_FILE="backups/petshop_backup_$(date +%Y%m%d_%H%M%S).db"

# Copy database file from container
echo "📦 Creating backup..."
docker cp petshop-sqlite:/data/petshop.db "$BACKUP_FILE"

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "📊 Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo ""
    echo "💡 To restore this backup later, use:"
    echo "   ./restore-db.sh $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    exit 1
fi



