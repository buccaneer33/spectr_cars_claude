#!/bin/sh
set -e

echo "🔄 Waiting for database..."

# Wait for PostgreSQL to be ready
until nc -z postgres 5432 2>/dev/null; do
  echo "   Waiting for postgres:5432..."
  sleep 2
done

echo "✅ Database is ready"

echo "🔄 Applying database schema..."
npx prisma db push --skip-generate

echo "✅ Schema applied"

echo "🚀 Starting search-service..."
exec node dist/index.js
