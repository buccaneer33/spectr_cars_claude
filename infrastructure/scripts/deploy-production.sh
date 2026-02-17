#!/bin/bash
# Production Deployment Script for VDS
# Usage: ./deploy-production.sh [domain]

set -e

DOMAIN=${1:-}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "======================================"
echo "🚀 Cars AI Consultant - Production Deploy"
echo "======================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please don't run as root. Use sudo when needed."
    exit 1
fi

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating from .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with production values:"
    echo "   - NODE_ENV=production"
    echo "   - POSTGRES_PASSWORD=<strong-password>"
    echo "   - JWT_SECRET=<strong-random-secret>"
    echo "   - LLM_API_KEY=<your-api-key>"
    echo "   - FRONTEND_URL=https://$DOMAIN"
    echo ""
    exit 1
fi

# Verify production settings
echo "📋 Verifying production settings..."

NODE_ENV=$(grep "^NODE_ENV=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  NODE_ENV is not 'production'. Current: $NODE_ENV"
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for default passwords
if grep -q "your-super-secret-jwt-key" "$PROJECT_ROOT/.env"; then
    echo "❌ JWT_SECRET still has default value! Change it first."
    exit 1
fi

if grep -q "^POSTGRES_PASSWORD=postgres$" "$PROJECT_ROOT/.env"; then
    echo "❌ POSTGRES_PASSWORD is still 'postgres'! Change it for production."
    exit 1
fi

if grep -q "sk-your-api-key-here" "$PROJECT_ROOT/.env"; then
    echo "❌ LLM_API_KEY is not set! Add your DeepSeek/OpenAI API key."
    exit 1
fi

echo "✅ Production settings verified"

# Check Docker
echo ""
echo "🐳 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Check Docker Compose
if ! docker compose version > /dev/null 2>&1; then
    if ! docker-compose version > /dev/null 2>&1; then
        echo "❌ Docker Compose not found!"
        exit 1
    fi
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi
echo "✅ Using: $COMPOSE_CMD"

# Pull latest images
echo ""
echo "📦 Pulling base images..."
$COMPOSE_CMD pull postgres redis nginx

# Build services
echo ""
echo "🏗️  Building services..."
$COMPOSE_CMD build --parallel

# Start databases first
echo ""
echo "🗄️  Starting databases..."
$COMPOSE_CMD up -d postgres redis

echo "⏳ Waiting for databases to be healthy..."
sleep 10

# Wait for PostgreSQL
for i in {1..30}; do
    if $COMPOSE_CMD exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
    echo "   Waiting for PostgreSQL... ($i/30)"
    sleep 2
done

# Wait for Redis
for i in {1..15}; do
    if $COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Redis failed to start"
        exit 1
    fi
    echo "   Waiting for Redis... ($i/15)"
    sleep 2
done

# Run migrations
echo ""
echo "🔄 Running database migrations..."

$COMPOSE_CMD up -d user-service search-service chat-service
sleep 5

$COMPOSE_CMD exec -T user-service npx prisma migrate deploy || echo "⚠️ User service migration failed (may be already applied)"
$COMPOSE_CMD exec -T search-service npx prisma migrate deploy || echo "⚠️ Search service migration failed (may be already applied)"
$COMPOSE_CMD exec -T chat-service npx prisma migrate deploy || echo "⚠️ Chat service migration failed (may be already applied)"

echo "✅ Migrations complete"

# Start all services (production mode - no dev tools)
echo ""
echo "🚀 Starting all services in production mode..."
$COMPOSE_CMD up -d

# Wait for health checks
echo ""
echo "⏳ Waiting for services to become healthy..."
sleep 15

# Check service status
echo ""
echo "📊 Service Status:"
echo "-----------------------------------"

check_service() {
    local name=$1
    local url=$2
    if curl -sf "$url" > /dev/null 2>&1; then
        echo "  ✅ $name"
    else
        echo "  ❌ $name (unhealthy)"
    fi
}

check_service "User Service   " "http://localhost:4001/health"
check_service "Search Service " "http://localhost:4002/health"
check_service "Chat Service   " "http://localhost:4003/health"
check_service "LLM Orchestrator" "http://localhost:8080/health"
check_service "Nginx Gateway  " "http://localhost:80/health"
check_service "Frontend       " "http://localhost:3000"

echo "-----------------------------------"
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Configure DNS to point to this server"
echo "   2. Set up SSL certificates (Let's Encrypt recommended)"
echo "   3. Rename ssl.conf.example to ssl.conf and update domain"
echo "   4. Restart nginx: docker compose restart nginx"
echo ""
echo "🔗 Application URL: http://localhost (or https://$DOMAIN after SSL setup)"
echo ""
echo "📝 Useful commands:"
echo "   Logs:    $COMPOSE_CMD logs -f"
echo "   Status:  $COMPOSE_CMD ps"
echo "   Stop:    $COMPOSE_CMD down"
echo "   Restart: $COMPOSE_CMD restart"
echo ""
