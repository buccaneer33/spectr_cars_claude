#!/bin/bash

set -e

echo "📥 Loading initial data dump into search_db..."

# Check if database has data already
DATA_COUNT=$(docker exec cars_postgres psql -U postgres search_db -t -c "SELECT COUNT(*) FROM \"Brand\";" 2>/dev/null || echo "0")

if [ "$DATA_COUNT" -gt "0" ]; then
    echo "⚠️  Database already contains data ($DATA_COUNT brands)"
    echo "   Do you want to reload? This will DELETE all existing data! (yes/no)"
    read CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "❌ Cancelled"
        exit 0
    fi

    echo "🗑️  Clearing existing data..."
    docker exec cars_postgres psql -U postgres search_db -c "
        TRUNCATE TABLE \"Specification\" CASCADE;
        TRUNCATE TABLE \"Model\" CASCADE;
        TRUNCATE TABLE \"Brand\" CASCADE;
        TRUNCATE TABLE \"City\" CASCADE;
        TRUNCATE TABLE \"Country\" CASCADE;
        TRUNCATE TABLE \"BodyType\" CASCADE;
        TRUNCATE TABLE \"FuelType\" CASCADE;
        TRUNCATE TABLE \"Transmission\" CASCADE;
        TRUNCATE TABLE \"DriveType\" CASCADE;
    "
fi

# Check if dump file exists
DUMP_FILE="./database/dumps/initial-data.sql"

if [ ! -f "$DUMP_FILE" ]; then
    echo "❌ Dump file not found: $DUMP_FILE"
    echo "   Run 'node database/scripts/parse-cars-xml.js' first to generate the dump"
    exit 1
fi

echo "📦 Loading dump (this may take 30-60 seconds)..."

# Load the dump
docker exec -i cars_postgres psql -U postgres search_db < "$DUMP_FILE"

# Verify data loaded
BRAND_COUNT=$(docker exec cars_postgres psql -U postgres search_db -t -c "SELECT COUNT(*) FROM \"Brand\";")
MODEL_COUNT=$(docker exec cars_postgres psql -U postgres search_db -t -c "SELECT COUNT(*) FROM \"Model\";")
SPEC_COUNT=$(docker exec cars_postgres psql -U postgres search_db -t -c "SELECT COUNT(*) FROM \"Specification\";")

echo ""
echo "✅ Data loaded successfully!"
echo ""
echo "📊 Statistics:"
echo "   Brands:          $BRAND_COUNT"
echo "   Models:          $MODEL_COUNT"
echo "   Specifications:  $SPEC_COUNT"
echo ""
echo "🎉 Search database is ready!"
echo ""
