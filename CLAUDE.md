# Cars AI Consultant - Общие инструкции

## Структура проекта

```
cars/
├── backend/           # Микросервисы Node.js (users, search, chat) + shared модуль
├── frontend/          # React 19 + TypeScript + Vite 6
├── llm-orchestrator/  # AI Gateway (DeepSeek по умолчанию, OpenAI опционально)
├── database/          # PostgreSQL + Redis конфигурация, seeds, parse-xml
├── infrastructure/    # Nginx, Docker конфигурации, bash-скрипты
├── docker-compose.yml # Единый compose для всего проекта
├── Makefile           # Команды управления проектом
├── .env.example       # Шаблон переменных окружения
└── cars.xml           # Исходные данные автомобилей (XML)
```

## КРИТИЧЕСКИ ВАЖНО (для всех модулей):

### 1. npm install вместо npm ci
Всегда использовать `npm install` вместо `npm ci`, так как package-lock.json может отсутствовать в репозитории.

### 2. .dockerignore обязателен
ОБЯЗАТЕЛЬНО создавать файл `.dockerignore` в корне каждого Docker build context для исключения:
- `node_modules/` - основная причина медленной сборки
- `dist/` - будет пересобрано в контейнере
- `.env` файлы (кроме .env.example)
- IDE файлы (.idea, .vscode)
- Тесты и coverage

Пример .dockerignore:
```
node_modules
**/node_modules
dist
**/dist
.env
.env.*
!.env.example
.git
*.md
coverage
```

### 3. Порядок сборки
1. Сначала собирать shared модули (`backend/shared`)
2. Затем сервисы, которые от них зависят

### 4. TypeScript paths
При использовании file-based dependencies (`"@cars/shared": "file:../../shared"`) в package.json:
- НЕ нужно добавлять `paths` в tsconfig.json
- Модуль будет автоматически доступен через node_modules после `npm install`
- Shared модуль должен быть собран (`npm run build`) перед установкой зависимостей в сервисах

### 5. Зависимости
Если модуль использует типы из зависимости shared модуля (например, `zod`), эту зависимость нужно также добавить в package.json сервиса.

### 6. Актуальные версии зависимостей
- **Express**: `^4.18.2` (shared, services), `^4.21.0` (llm-orchestrator) — НЕ Express 5
- **Prisma**: `^5.20.0` — НЕ Prisma 6
- **Vite**: `^6.0.0`
- **React**: `^19.0.0`
- **@types/express**: `^4.17.21` (в shared и services), `^5.0.0` (в llm-orchestrator)

### 7. LLM Provider — DeepSeek по умолчанию
LLM Orchestrator поддерживает два провайдера, настраиваемых через `.env`:
- **DeepSeek** (по умолчанию): `LLM_PROVIDER=deepseek`, `LLM_MODEL=deepseek-chat`
- **OpenAI** (альтернатива): `LLM_PROVIDER=openai`, `LLM_MODEL=gpt-4-turbo-preview`

Переменные окружения:
```env
LLM_PROVIDER=deepseek
LLM_API_KEY=sk-your-api-key
LLM_MODEL=deepseek-chat
LLM_BASE_URL=https://api.deepseek.com
```

### 8. Docker build context для backend сервисов
В `docker-compose.yml` build context для backend сервисов — это `./backend`, а не индивидуальная папка сервиса:
```yaml
user-service:
  build:
    context: ./backend
    dockerfile: services/users/Dockerfile
```
Dockerfile в каждом сервисе сначала копирует и собирает shared модуль, затем сам сервис.

### 9. Загрузка данных из cars.xml
Для парсинга XML-файла с автомобилями и загрузки данных в search_db:
```bash
make parse-xml    # Парсинг cars.xml → SQL dump
make load-dump    # Загрузка dump в search_db
```

## Makefile — основные команды

```bash
make init          # Первичная инициализация (создаёт .env, собирает, мигрирует, сидирует)
make start         # Запуск в dev режиме (с PgAdmin, Redis Commander)
make start-prod    # Запуск в production режиме
make stop          # Остановка всех сервисов
make restart       # Перезапуск
make logs          # Логи всех сервисов (make logs SERVICE=user-service)
make migrate       # Запуск Prisma миграций
make seed          # Seed данных
make parse-xml     # Парсинг cars.xml в SQL dump
make load-dump     # Загрузка dump в search_db
make build         # Пересборка Docker images
make health        # Проверка здоровья сервисов
make ps            # Список контейнеров
make shell-user    # Shell в user-service
make shell-search  # Shell в search-service
make shell-chat    # Shell в chat-service
make shell-llm     # Shell в llm-orchestrator
make shell-db      # Shell в PostgreSQL
make backup        # Backup всех баз данных
make clean         # Удаление всех контейнеров и volumes (ОСТОРОЖНО!)
```

## Порядок запуска

### Быстрый старт (через Makefile):
```bash
cp .env.example .env       # Создать .env, добавить LLM_API_KEY
make init                   # Всё автоматически: build, migrate, seed, start
```

### Ручной запуск:
```bash
# 1. Создать .env из шаблона
cp .env.example .env
# Обязательно указать LLM_API_KEY!

# 2. Инфраструктура
docker-compose up postgres redis -d

# 3. Сборка shared модуля
cd backend/shared && npm install && npm run build

# 4. Установка и сборка сервисов
cd backend/services/users && npm install && npm run build
cd backend/services/search && npm install && npm run build
cd backend/services/chat && npm install && npm run build

# 5. Миграции
cd backend/services/users && npx prisma migrate dev
cd backend/services/search && npx prisma migrate dev
cd backend/services/chat && npx prisma migrate dev

# 6. Seed данных
cd database && npm run seed:all

# 7. (Опционально) Загрузка данных из cars.xml
make parse-xml && make load-dump

# 8. Запуск через Docker
docker-compose up --build
```

## Порты сервисов

| Сервис | Порт | URL |
|--------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Nginx Gateway | 80 | http://localhost:80 |
| User Service | 4001 | http://localhost:4001 |
| Search Service | 4002 | http://localhost:4002 |
| Chat Service | 4003 | http://localhost:4003 |
| LLM Orchestrator | 8080 | http://localhost:8080 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| PgAdmin (dev) | 5050 | http://localhost:5050 |
| Redis Commander (dev) | 8081 | http://localhost:8081 |

## Dev Tools
PgAdmin и Redis Commander доступны только в dev режиме (через Docker profile `dev`):
```bash
make start        # dev режим — с PgAdmin и Redis Commander
make start-prod   # production режим — без dev tools
```
