.PHONY: init start stop restart logs migrate seed clean build health ps help

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "🚗 Cars AI Consultant - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

init: ## 🚀 Initialize project (first time setup)
	@chmod +x infrastructure/scripts/*.sh
	@./infrastructure/scripts/init.sh

start: ## ▶️  Start all services (dev mode)
	@./infrastructure/scripts/start.sh dev

start-prod: ## ▶️  Start in production mode
	@./infrastructure/scripts/start.sh prod

stop: ## ⏹️  Stop all services
	@./infrastructure/scripts/stop.sh

restart: stop start ## 🔄 Restart all services

logs: ## 📋 Show logs (use: make logs SERVICE=user-service)
	@./infrastructure/scripts/logs.sh $(SERVICE)

migrate: ## 🔄 Run database migrations
	@./infrastructure/scripts/migrate.sh

seed: ## 🌱 Seed databases with data
	@./infrastructure/scripts/seed.sh

parse-xml: ## 🔄 Parse cars.xml and generate SQL dump
	@echo "Parsing cars.xml (this may take a minute)..."
	@cd database/scripts && node parse-cars-xml.js

load-dump: ## 📥 Load initial data dump into search_db
	@chmod +x database/scripts/load-dump.sh
	@./database/scripts/load-dump.sh

build: ## 🏗️  Rebuild Docker images
	@docker-compose build --parallel

clean: ## 🗑️  Stop and remove all containers, networks, volumes (CAREFUL!)
	@echo "⚠️  This will remove all data. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@docker-compose down -v
	@docker system prune -f

health: ## ❤️  Check health of all services
	@echo "Checking services health..."
	@curl -s http://localhost:80/health/user | jq . || echo "❌ User Service"
	@curl -s http://localhost:80/health/search | jq . || echo "❌ Search Service"
	@curl -s http://localhost:80/health/chat | jq . || echo "❌ Chat Service"
	@curl -s http://localhost:80/health/llm | jq . || echo "❌ LLM Orchestrator"

ps: ## 📊 Show running containers
	@docker-compose ps

shell-user: ## 💻 Shell into user-service
	@docker-compose exec user-service sh

shell-search: ## 💻 Shell into search-service
	@docker-compose exec search-service sh

shell-chat: ## 💻 Shell into chat-service
	@docker-compose exec chat-service sh

shell-llm: ## 💻 Shell into llm-orchestrator
	@docker-compose exec llm-orchestrator sh

shell-db: ## 💻 Shell into postgres
	@docker-compose exec postgres psql -U postgres

backup: ## 💾 Backup all databases
	@cd database && ./scripts/backup.sh

restore: ## ♻️  Restore databases (use: make restore FILE=backup.tar.gz)
	@cd database && ./scripts/restore.sh $(FILE)

dev-tools: ## 🛠️  Open development tools
	@echo "Opening development tools..."
	@echo "PgAdmin:         http://localhost:5050"
	@echo "Redis Commander: http://localhost:8081"
	@echo "Frontend:        http://localhost:3000"

test: ## 🧪 Run tests (placeholder)
	@echo "Running tests..."
	@echo "⚠️  Tests not yet implemented"

lint: ## 🔍 Run linter (placeholder)
	@echo "Running linter..."
	@echo "⚠️  Linter not yet configured"
