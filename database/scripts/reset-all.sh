#!/bin/bash

set -e

echo "⚠️  WARNING: This will DELETE ALL DATA from all databases!"
echo "   Are you absolutely sure? Type 'DELETE ALL DATA' to confirm:"
read CONFIRM

if [ "$CONFIRM" != "DELETE ALL DATA" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "🗑️  Dropping all databases..."

docker exec cars_postgres psql -U postgres -c "DROP DATABASE IF EXISTS users_db;"
docker exec cars_postgres psql -U postgres -c "DROP DATABASE IF EXISTS search_db;"
docker exec cars_postgres psql -U postgres -c "DROP DATABASE IF EXISTS chat_db;"

echo "✅ Databases dropped"
echo ""
echo "🔧 Re-creating databases..."

docker exec cars_postgres psql -U postgres -f /docker-entrypoint-initdb.d/01-init.sql

echo "✅ Databases re-created"
echo ""
echo "📝 Next steps:"
echo "   1. Run migrations: make migrate"
echo "   2. Seed data: make seed"
echo "   3. Or load dump: make load-dump"
echo ""
