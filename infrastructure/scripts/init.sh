#!/bin/bash

set -e

echo "🚀 Initializing Cars AI Consultant Project..."

# 1. Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your settings:"
    echo "   - Add your OPENAI_API_KEY"
    echo "   - Change JWT_SECRET for production"
    echo "   - Review other settings"
    echo ""
    echo "After editing .env, run this script again:"
    echo "   ./infrastructure/scripts/init.sh"
    exit 1
fi

# 2. Check if OPENAI_API_KEY is set
if grep -q "sk-your-api-key-here" .env; then
    echo "❌ OPENAI_API_KEY not set in .env"
    echo "   Please add your OpenAI API key to .env file"
    exit 1
fi

# 3. Create necessary directories
echo "📁 Creating directories..."
mkdir -p infrastructure/ssl/certs
mkdir -p database/backups
mkdir -p logs

# 4. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# 5. Build images
echo ""
echo "🏗️  Building Docker images (this may take a few minutes)..."
docker-compose build --parallel

echo ""
echo "✅ Images built successfully!"

# 6. Start databases first
echo ""
echo "🗄️  Starting databases..."
docker-compose up -d postgres redis

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
echo "   This may take 30-60 seconds..."

timeout 90 bash -c '
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "   ⏳ PostgreSQL starting..."
    sleep 3
done
echo "   ✅ PostgreSQL ready!"
'

timeout 60 bash -c '
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo "   ⏳ Redis starting..."
    sleep 2
done
echo "   ✅ Redis ready!"
'

# 7. Start all services
echo ""
echo "🚀 Starting all services..."
docker-compose --profile dev up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# 8. Show status
echo ""
echo "📊 Services status:"
docker-compose ps

echo ""
echo "✅ Initialization complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Your application is running:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   🌐 Frontend:        http://localhost:3000"
echo "   🔧 API Gateway:     http://localhost:80"
echo "   📊 PgAdmin:         http://localhost:5050"
echo "      Login: admin@cars.ru / admin"
echo "   🔴 Redis Commander: http://localhost:8081"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   1. Apply migrations:"
echo "      make migrate"
echo ""
echo "   2. Seed databases:"
echo "      make seed"
echo ""
echo "   3. View logs:"
echo "      make logs"
echo ""
echo "   4. Stop services:"
echo "      make stop"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
