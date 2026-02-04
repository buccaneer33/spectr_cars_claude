#!/bin/bash

set -e

# Backup всех баз данных
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

echo "📦 Creating backup at $BACKUP_DIR..."

mkdir -p "$BACKUP_DIR"

# Backup каждой БД
echo "   📊 Backing up users_db..."
docker exec cars_postgres pg_dump -U postgres users_db > "$BACKUP_DIR/users_db.sql"

echo "   📊 Backing up search_db..."
docker exec cars_postgres pg_dump -U postgres search_db > "$BACKUP_DIR/search_db.sql"

echo "   📊 Backing up chat_db..."
docker exec cars_postgres pg_dump -U postgres chat_db > "$BACKUP_DIR/chat_db.sql"

# Compress
echo "   🗜️  Compressing..."
tar -czf "./backups/$DATE.tar.gz" -C ./backups "$DATE"
rm -rf "$BACKUP_DIR"

echo ""
echo "✅ Backup created successfully!"
echo "   📁 Location: ./backups/$DATE.tar.gz"
echo ""

# Show backup size
SIZE=$(du -h "./backups/$DATE.tar.gz" | cut -f1)
echo "   💾 Size: $SIZE"
echo ""
