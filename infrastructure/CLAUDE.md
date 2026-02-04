# Infrastructure - Единая инфраструктура проекта

Настрой полную инфраструктуру для запуска всего проекта одной командой `docker-compose up`.

## Архитектура:

```
infrastructure/
├── nginx/
│   ├── nginx.conf           # Главный конфиг
│   ├── conf.d/
│   │   ├── default.conf    # Проксирование на сервисы
│   │   └── ssl.conf        # SSL настройки (production)
│   └── Dockerfile
│
├── monitoring/              # Опционально для production
│   ├── prometheus/
│   │   └── prometheus.yml
│   ├── grafana/
│   │   └── dashboards/
│   └── docker-compose.monitoring.yml
│
├── scripts/
│   ├── init.sh             # Первичная инициализация
│   ├── start.sh            # Запуск всех сервисов
│   ├── stop.sh             # Остановка
│   ├── logs.sh             # Просмотр логов
│   ├── migrate.sh          # Запуск миграций
│   └── seed.sh             # Seed данных
│
└── ssl/                     # SSL сертификаты (production)
    ├── certs/
    └── README.md
```

**Корневой файл:**
```
/ (root)
└── docker-compose.yml       # Единый compose для всего проекта
```

---

## КОРНЕВОЙ DOCKER-COMPOSE.YML

```yaml
version: '3.8'

# Общие настройки для всех сервисов
x-common-variables: &common-variables
  NODE_ENV: ${NODE_ENV:-development}
  LOG_LEVEL: ${LOG_LEVEL:-info}

x-common-healthcheck: &common-healthcheck
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

networks:
  cars-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:

services:
  # ==================== DATABASES ====================

  postgres:
    image: postgres:16-alpine
    container_name: cars_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/scripts/init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql
    networks:
      - cars-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      <<: *common-healthcheck

  redis:
    image: redis:7-alpine
    container_name: cars_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - cars-network
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      <<: *common-healthcheck

  # ==================== BACKEND SERVICES ====================

  user-service:
    build:
      context: ./backend
      dockerfile: services/users/Dockerfile
    container_name: cars_user_service
    restart: unless-stopped
    environment:
      <<: *common-variables
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/users_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      PORT: 4001
    ports:
      - "4001:4001"
    networks:
      - cars-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4001/health"]
      <<: *common-healthcheck

  search-service:
    build:
      context: ./backend
      dockerfile: services/search/Dockerfile
    container_name: cars_search_service
    restart: unless-stopped
    environment:
      <<: *common-variables
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/search_db
      REDIS_URL: redis://redis:6379
      PORT: 4002
    ports:
      - "4002:4002"
    networks:
      - cars-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4002/health"]
      <<: *common-healthcheck

  chat-service:
    build:
      context: ./backend
      dockerfile: services/chat/Dockerfile
    container_name: cars_chat_service
    restart: unless-stopped
    environment:
      <<: *common-variables
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/chat_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-in-production}
      USER_SERVICE_URL: http://user-service:4001
      SEARCH_SERVICE_URL: http://search-service:4002
      LLM_ORCHESTRATOR_URL: http://llm-orchestrator:8080
      PORT: 4003
    ports:
      - "4003:4003"
    networks:
      - cars-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      user-service:
        condition: service_healthy
      search-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4003/health"]
      <<: *common-healthcheck

  # ==================== LLM ORCHESTRATOR ====================

  llm-orchestrator:
    build:
      context: ./llm-orchestrator
      dockerfile: Dockerfile
    container_name: cars_llm_orchestrator
    restart: unless-stopped
    environment:
      <<: *common-variables
      LLM_PROVIDER: ${LLM_PROVIDER:-deepseek}
      LLM_API_KEY: ${LLM_API_KEY}
      LLM_MODEL: ${LLM_MODEL:-deepseek-chat}
      LLM_BASE_URL: ${LLM_BASE_URL:-https://api.deepseek.com}
      REDIS_URL: redis://redis:6379
      SEARCH_SERVICE_URL: http://search-service:4002
      USER_SERVICE_URL: http://user-service:4001
      CHAT_SERVICE_URL: http://chat-service:4003
      PORT: 8080
    ports:
      - "8080:8080"
    networks:
      - cars-network
    depends_on:
      redis:
        condition: service_healthy
      search-service:
        condition: service_healthy
      user-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health"]
      <<: *common-healthcheck

  # ==================== NGINX GATEWAY ====================

  nginx:
    build:
      context: ./infrastructure/nginx
      dockerfile: Dockerfile
    container_name: cars_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/conf.d:/etc/nginx/conf.d:ro
    networks:
      - cars-network
    depends_on:
      user-service:
        condition: service_healthy
      search-service:
        condition: service_healthy
      chat-service:
        condition: service_healthy
      llm-orchestrator:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      <<: *common-healthcheck

  # ==================== FRONTEND ====================

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-http://localhost:80}
    container_name: cars_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    networks:
      - cars-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:3000"]
      <<: *common-healthcheck

  # ==================== DEVELOPMENT TOOLS ====================

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: cars_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@cars.ru}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-admin}
      PGADMIN_CONFIG_SERVER_MODE: 'False'
      PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - cars-network
    depends_on:
      postgres:
        condition: service_healthy
    profiles:
      - dev
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/misc/ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: cars_redis_commander
    restart: unless-stopped
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    networks:
      - cars-network
    depends_on:
      redis:
        condition: service_healthy
    profiles:
      - dev
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8081"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## NGINX CONFIGURATION

### Main Config (infrastructure/nginx/nginx.conf):

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Include configs
    include /etc/nginx/conf.d/*.conf;
}
```

### Default Config (infrastructure/nginx/conf.d/default.conf):

```nginx
# Upstream definitions
upstream user_service {
    server user-service:4001 max_fails=3 fail_timeout=30s;
}

upstream search_service {
    server search-service:4002 max_fails=3 fail_timeout=30s;
}

upstream chat_service {
    server chat-service:4003 max_fails=3 fail_timeout=30s;
}

upstream llm_orchestrator {
    server llm-orchestrator:8080 max_fails=3 fail_timeout=30s;
}

upstream frontend {
    server frontend:3000 max_fails=3 fail_timeout=30s;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=llm_limit:10m rate=2r/s;

# Main server block
server {
    listen 80;
    server_name localhost;

    # Security
    server_tokens off;

    # CORS для API запросов
    add_header Access-Control-Allow-Origin $http_origin always;
    add_header Access-Control-Allow-Credentials true always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;

    # Preflight requests
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin $http_origin;
        add_header Access-Control-Allow-Credentials true;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS, PATCH";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
        add_header Access-Control-Max-Age 86400;
        add_header Content-Length 0;
        add_header Content-Type text/plain;
        return 204;
    }

    # ==================== API ROUTES ====================

    # User Service - Auth & Profile
    location /api/auth/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://user_service/api/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /api/users/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://user_service/api/users/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Search Service
    location /api/search/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://search_service/api/search/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Chat Service
    location /api/chat/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://chat_service/api/chat/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;  # Longer timeout for LLM processing
        proxy_read_timeout 60s;
    }

    # LLM Orchestrator (Internal only - not exposed directly)
    # Chat Service proxies to it

    # Health checks для мониторинга
    location /health/user {
        proxy_pass http://user_service/health;
        access_log off;
    }

    location /health/search {
        proxy_pass http://search_service/health;
        access_log off;
    }

    location /health/chat {
        proxy_pass http://chat_service/health;
        access_log off;
    }

    location /health/llm {
        proxy_pass http://llm_orchestrator/health;
        access_log off;
    }

    # ==================== FRONTEND ====================

    location / {
        proxy_pass http://frontend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # WebSocket support (если нужен для HMR в dev)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Nginx Dockerfile (infrastructure/nginx/Dockerfile):

```dockerfile
FROM nginx:alpine

# Install wget for healthchecks
RUN apk add --no-cache wget

# Copy configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d /etc/nginx/conf.d

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

---

## SCRIPTS

### Init Script (infrastructure/scripts/init.sh):

```bash
#!/bin/bash

set -e

echo "🚀 Initializing Cars AI Consultant Project..."

# 1. Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your settings (especially LLM_API_KEY)"
    exit 1
fi

# 2. Create necessary directories
echo "📁 Creating directories..."
mkdir -p infrastructure/ssl/certs
mkdir -p database/backups
mkdir -p logs

# 3. Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# 4. Build and start infrastructure
echo "🏗️  Building Docker images..."
docker-compose build --parallel

# 5. Start databases first
echo "🗄️  Starting databases..."
docker-compose up -d postgres redis

# Wait for databases to be healthy
echo "⏳ Waiting for databases to be ready..."
timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U postgres; do sleep 2; done'
timeout 30 bash -c 'until docker-compose exec -T redis redis-cli ping; do sleep 2; done'

echo "✅ Databases are ready!"

# 6. Run migrations
echo "🔄 Running migrations..."
./infrastructure/scripts/migrate.sh

# 7. Seed data
echo "🌱 Seeding data..."
./infrastructure/scripts/seed.sh

# 8. Start all services
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Initialization complete!"
echo ""
echo "📊 Services:"
echo "   Frontend:        http://localhost:3000"
echo "   API Gateway:     http://localhost:80"
echo "   PgAdmin:         http://localhost:5050 (admin@cars.ru / admin)"
echo "   Redis Commander: http://localhost:8081"
echo ""
echo "📝 Logs: docker-compose logs -f"
echo "🛑 Stop: docker-compose down"
echo ""
```

### Start Script (infrastructure/scripts/start.sh):

```bash
#!/bin/bash

set -e

# Проверка .env
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run ./infrastructure/scripts/init.sh first"
    exit 1
fi

# Режим запуска
MODE=${1:-dev}

echo "🚀 Starting Cars AI Consultant..."
echo "   Mode: $MODE"

if [ "$MODE" = "dev" ]; then
    # Development mode - с PgAdmin и Redis Commander
    docker-compose --profile dev up -d
else
    # Production mode - без dev tools
    docker-compose up -d
fi

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Health check
SERVICES="user-service search-service chat-service llm-orchestrator nginx"
for service in $SERVICES; do
    if docker-compose ps | grep $service | grep -q "Up (healthy)"; then
        echo "   ✅ $service"
    else
        echo "   ⏳ $service (starting...)"
    fi
done

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Open http://localhost:3000 to use the app"
echo ""
```

### Stop Script (infrastructure/scripts/stop.sh):

```bash
#!/bin/bash

echo "🛑 Stopping all services..."
docker-compose down

echo "✅ All services stopped"
echo ""
echo "💾 Data preserved in volumes. To remove data:"
echo "   docker-compose down -v"
```

### Logs Script (infrastructure/scripts/logs.sh):

```bash
#!/bin/bash

SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
    # All services
    docker-compose logs -f --tail=100
else
    # Specific service
    docker-compose logs -f --tail=100 $SERVICE
fi
```

### Migrate Script (infrastructure/scripts/migrate.sh):

```bash
#!/bin/bash

set -e

echo "🔄 Running database migrations..."

# User Service
echo "   📦 User Service..."
docker-compose exec -T user-service npx prisma migrate deploy

# Search Service
echo "   📦 Search Service..."
docker-compose exec -T search-service npx prisma migrate deploy

# Chat Service
echo "   📦 Chat Service..."
docker-compose exec -T chat-service npx prisma migrate deploy

echo "✅ All migrations complete!"
```

### Seed Script (infrastructure/scripts/seed.sh):

```bash
#!/bin/bash

set -e

echo "🌱 Seeding databases..."

# Переходим в папку database
cd database

# User Service
echo "   👥 Seeding users..."
npm run seed:users

# Search Service
echo "   🚗 Seeding search catalog..."
npm run seed:search

# Chat Service
echo "   💬 Seeding chat..."
npm run seed:chat

cd ..

echo "✅ All databases seeded!"
```

---

## ENVIRONMENT VARIABLES (.env.example)

```env
# ==================== General ====================
NODE_ENV=development
LOG_LEVEL=info

# ==================== Databases ====================
POSTGRES_PASSWORD=postgres

# PostgreSQL URLs (используются сервисами)
DATABASE_URL_USERS=postgresql://postgres:postgres@postgres:5432/users_db
DATABASE_URL_SEARCH=postgresql://postgres:postgres@postgres:5432/search_db
DATABASE_URL_CHAT=postgresql://postgres:postgres@postgres:5432/chat_db

# Redis
REDIS_URL=redis://redis:6379

# ==================== Backend Services ====================

# JWT Secret (ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ В PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-please

# Frontend URL (для CORS)
FRONTEND_URL=http://localhost:3000

# ==================== LLM Orchestrator ====================

# LLM Provider: 'deepseek' or 'openai'
LLM_PROVIDER=deepseek

# DeepSeek API (default)
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com

# Alternative: OpenAI
# LLM_PROVIDER=openai
# LLM_API_KEY=sk-your-openai-key
# LLM_MODEL=gpt-4-turbo-preview
# LLM_BASE_URL=https://api.openai.com/v1

# ==================== Frontend ====================

# API URL для frontend
VITE_API_URL=http://localhost:80

# ==================== Development Tools ====================

# PgAdmin
PGADMIN_EMAIL=admin@cars.ru
PGADMIN_PASSWORD=admin

# ==================== Production Settings ====================

# SSL (для production)
# SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
# SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

---

## MAKEFILE (для удобства)

```makefile
.PHONY: init start stop restart logs migrate seed clean build help

help: ## Show this help
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

init: ## Initialize project (first time setup)
	@chmod +x infrastructure/scripts/*.sh
	@./infrastructure/scripts/init.sh

start: ## Start all services
	@./infrastructure/scripts/start.sh dev

start-prod: ## Start in production mode
	@./infrastructure/scripts/start.sh prod

stop: ## Stop all services
	@./infrastructure/scripts/stop.sh

restart: stop start ## Restart all services

logs: ## Show logs (use: make logs SERVICE=user-service)
	@./infrastructure/scripts/logs.sh $(SERVICE)

migrate: ## Run database migrations
	@./infrastructure/scripts/migrate.sh

seed: ## Seed databases with data
	@./infrastructure/scripts/seed.sh

parse-xml: ## Parse cars.xml and generate SQL dump
	@echo "Parsing cars.xml..."
	@cd database/scripts && node parse-cars-xml.js

load-dump: ## Load initial data dump into search_db
	@chmod +x database/scripts/load-dump.sh
	@./database/scripts/load-dump.sh

build: ## Rebuild Docker images
	@docker-compose build --parallel

clean: ## Stop and remove all containers, networks, volumes
	@echo "⚠️  This will remove all data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@docker-compose down -v
	@docker system prune -f

health: ## Check health of all services
	@curl -s http://localhost:80/health/user | jq .
	@curl -s http://localhost:80/health/search | jq .
	@curl -s http://localhost:80/health/chat | jq .
	@curl -s http://localhost:80/health/llm | jq .

ps: ## Show running containers
	@docker-compose ps

shell-user: ## Shell into user-service
	@docker-compose exec user-service sh

shell-search: ## Shell into search-service
	@docker-compose exec search-service sh

shell-chat: ## Shell into chat-service
	@docker-compose exec chat-service sh

shell-llm: ## Shell into llm-orchestrator
	@docker-compose exec llm-orchestrator sh

shell-db: ## Shell into postgres
	@docker-compose exec postgres psql -U postgres

backup: ## Backup all databases
	@cd database && ./scripts/backup.sh

restore: ## Restore databases (use: make restore FILE=backup.tar.gz)
	@cd database && ./scripts/restore.sh $(FILE)
```

---

## ПОРЯДОК ПЕРВОГО ЗАПУСКА:

```bash
# 1. Клонировать репозиторий (или создать структуру)
git clone <repo> && cd cars

# 2. Создать .env из примера
cp .env.example .env

# 3. Добавить LLM_API_KEY в .env
nano .env  # или vim, code, etc.

# 4. Дать права на выполнение скриптов
chmod +x infrastructure/scripts/*.sh

# 5. Инициализация (первый раз)
make init
# ИЛИ
./infrastructure/scripts/init.sh

# Этот скрипт:
# - Проверит .env
# - Создаст директории
# - Соберёт Docker images
# - Запустит БД
# - Применит миграции
# - Засеет данные
# - Запустит все сервисы

# 6. Проверить статус
docker-compose ps

# 7. Открыть приложение
# http://localhost:3000
```

---

## ЕЖЕДНЕВНОЕ ИСПОЛЬЗОВАНИЕ:

```bash
# Запуск (dev mode с PgAdmin, Redis Commander)
make start

# Просмотр логов
make logs

# Просмотр логов конкретного сервиса
make logs SERVICE=llm-orchestrator

# Остановка
make stop

# Перезапуск
make restart

# Проверка здоровья сервисов
make health

# Shell в сервис
make shell-llm

# Backup БД
make backup

# Очистка всего (ОСТОРОЖНО - удалит данные!)
make clean
```

---

## PRODUCTION DEPLOYMENT:

```bash
# 1. Настроить .env для production
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
LLM_API_KEY=<your-key>

# 2. Настроить SSL
# - Положить сертификаты в infrastructure/ssl/certs/
# - Раскомментировать SSL конфиг в nginx

# 3. Запуск в production mode
make start-prod

# 4. Мониторинг
# - Настроить Prometheus/Grafana (опционально)
# - Настроить alerts
# - Логирование в внешнюю систему (ELK, Datadog)
```

---

## TROUBLESHOOTING:

### Проблема: Сервис не запускается

```bash
# Проверить логи
make logs SERVICE=<service-name>

# Проверить health
docker-compose ps

# Перезапустить конкретный сервис
docker-compose restart <service-name>
```

### Проблема: БД не доступна

```bash
# Проверить PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Проверить Redis
docker-compose exec redis redis-cli ping

# Пересоздать БД (ОСТОРОЖНО!)
docker-compose down postgres
docker volume rm cars_postgres_data
docker-compose up -d postgres
make migrate
make seed
```

### Проблема: "Port already in use"

```bash
# Найти процесс использующий порт
lsof -i :3000  # или :80, :5432, etc.

# Убить процесс
kill -9 <PID>

# Или изменить порты в docker-compose.yml
```

---

## КРИТИЧЕСКИ ВАЖНО:

1. **LLM_API_KEY** - обязательно задать перед запуском
2. **JWT_SECRET** - изменить для production (минимум 32 символа)
3. **POSTGRES_PASSWORD** - изменить для production
4. **Health checks** - все сервисы должны пройти health check перед стартом
5. **Порядок запуска** - БД → Backend → LLM → Nginx → Frontend
6. **Volumes** - данные сохраняются в volumes, `docker-compose down` не удаляет их
7. **Логи** - все логи доступны через `make logs`
8. **Backup** - регулярно делайте backup БД (`make backup`)
9. **Dev tools** - PgAdmin и Redis Commander доступны только в dev mode
10. **SSL** - для production обязательно настроить HTTPS

## Готово к запуску! 🚀

Всё настроено для запуска одной командой: `make init`
