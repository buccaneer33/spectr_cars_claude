#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: ./restore.sh <backup_file.tar.gz>"
  echo ""
  echo "Available backups:"
  ls -lh ./backups/*.tar.gz 2>/dev/null || echo "   No backups found"
  exit 1
fi

BACKUP_FILE=$1
TEMP_DIR="./backups/temp"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "📥 Restoring from $BACKUP_FILE..."
echo ""
echo "⚠️  WARNING: This will overwrite all current data!"
echo "   Do you want to continue? (yes/no)"
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

# Extract
echo "   📦 Extracting backup..."
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Get backup directory name
BACKUP_DATE=$(basename "$BACKUP_FILE" .tar.gz)

# Restore each DB
echo "   📊 Restoring users_db..."
docker exec -i cars_postgres psql -U postgres -d users_db < "$TEMP_DIR/$BACKUP_DATE/users_db.sql"

echo "   📊 Restoring search_db..."
docker exec -i cars_postgres psql -U postgres -d search_db < "$TEMP_DIR/$BACKUP_DATE/search_db.sql"

echo "   📊 Restoring chat_db..."
docker exec -i cars_postgres psql -U postgres -d chat_db < "$TEMP_DIR/$BACKUP_DATE/chat_db.sql"

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Restore completed successfully!"
echo ""
