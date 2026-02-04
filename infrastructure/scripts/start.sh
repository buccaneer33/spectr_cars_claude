#!/bin/bash

set -e

# Check .env
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run ./infrastructure/scripts/init.sh first"
    exit 1
fi

# Mode
MODE=${1:-dev}

echo "🚀 Starting Cars AI Consultant..."
echo "   Mode: $MODE"
echo ""

if [ "$MODE" = "dev" ]; then
    # Development mode - with PgAdmin and Redis Commander
    docker-compose --profile dev up -d
else
    # Production mode - without dev tools
    docker-compose up -d
fi

echo ""
echo "⏳ Waiting for services to be healthy (this may take 30-60 seconds)..."
sleep 10

# Health check
echo ""
echo "📊 Services status:"
docker-compose ps

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Open http://localhost:3000 to use the application"
echo ""
echo "📝 Useful commands:"
echo "   make logs              - View all logs"
echo "   make logs SERVICE=user-service - View specific service logs"
echo "   make stop              - Stop all services"
echo "   make health            - Check services health"
echo ""
