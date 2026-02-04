# Database Configuration - Cars AI Consultant

Конфигурация баз данных для микросервисной архитектуры с тремя отдельными PostgreSQL базами и Redis для кэширования.

## 📁 Структура

```
database/
├── schemas/                    # Prisma схемы для каждого сервиса
│   ├── user-service.prisma    # User + UserProfile
│   ├── search-service.prisma  # Каталог автомобилей
│   └── chat-service.prisma    # Чат и результаты поиска
│
├── seeds/                     # Seed данные для каждого сервиса
│   ├── users/
│   │   └── seed.ts           # Тестовые пользователи
│   ├── search/
│   │   └── seed.ts           # Проверка данных
│   └── chat/
│       └── seed.ts           # Пустая БД для старта
│
├── dumps/                     # SQL дампы
│   ├── initial-data.sql      # 81,823 спецификаций из cars.xml (13 МБ)
│   └── README.md             # Документация дампа
│
├── scripts/
│   ├── init-databases.sql    # Создание баз данных
│   ├── parse-cars-xml.js     # Парсер XML → SQL
│   ├── load-dump.sh          # Загрузка дампа
│   ├── backup.sh             # Резервное копирование
│   ├── restore.sh            # Восстановление
│   └── reset-all.sh          # Сброс всех БД (dev only)
│
├── docker/
│   ├── postgres/
│   │   └── postgresql.conf   # Конфигурация PostgreSQL
│   └── redis/
│       └── redis.conf        # Конфигурация Redis
│
├── migrations/               # История миграций Prisma
│   ├── users/
│   ├── search/
│   └── chat/
│
├── package.json              # Зависимости для seed скриптов
├── .env.example              # Пример переменных окружения
├── README.md                 # Этот файл
└── DATA-LOADING.md           # Инструкция по загрузке данных
```

## 🗄️ Архитектура баз данных

### 1. users_db - User Service
```
users
  ├─ id (uuid)
  ├─ email
  ├─ passwordHash
  ├─ name
  ├─ avatarUrl
  ├─ role (ADMIN/USER)
  ├─ status (ACTIVE/BLOCKED/PENDING)
  └─ createdAt, updatedAt

user_profiles
  ├─ userId (FK → users)
  ├─ preferredBudgetMinRub
  ├─ preferredBudgetMaxRub
  ├─ preferredBodyTypeId
  ├─ preferredFuelTypeId
  ├─ cityId
  └─ updatedAt
```

### 2. search_db - Search Service
```
Country, City, Brand, Model
BodyType, FuelType, Transmission, DriveType

Specification (81,823 записей)
  ├─ modelId, brandId
  ├─ name, externalId
  ├─ bodyTypeId, fuelTypeId, transmissionId, driveTypeId
  ├─ engineVolume, horsepower
  ├─ yearFrom, yearTo
  ├─ priceMin, priceMax
  ├─ fuelConsumption
  ├─ acceleration0to100, maxSpeed
  └─ maintenanceCostPerYear
```

### 3. chat_db - Chat Service
```
chat_sessions
  ├─ id (uuid)
  ├─ userId
  ├─ title
  ├─ contextSummary (JSON)
  ├─ status (active/completed/archived)
  └─ createdAt, finishedAt

chat_messages
  ├─ id (uuid)
  ├─ chatSessionId (FK)
  ├─ role (user/assistant/system)
  ├─ content
  ├─ metadata (JSON)
  └─ createdAt

search_results
  ├─ id (uuid)
  ├─ chatSessionId (FK)
  ├─ userId
  ├─ searchQuerySummary
  ├─ resultData (JSON)
  ├─ isSaved
  └─ createdAt
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
cd database
npm install
```

### 2. Создание .env файла

```bash
cp .env.example .env
```

### 3. Запуск Docker контейнеров

Из корня проекта:
```bash
docker-compose up -d postgres redis
```

Проверка:
```bash
docker-compose ps
# Должны быть: cars_postgres (healthy), cars_redis (healthy)
```

### 4. Применение миграций

После создания backend сервисов, примените миграции:

```bash
# User Service
cd ../backend/services/users
export DATABASE_URL=$DATABASE_URL_USERS
npx prisma migrate dev --name init

# Search Service
cd ../search
export DATABASE_URL=$DATABASE_URL_SEARCH
npx prisma migrate dev --name init

# Chat Service
cd ../chat
export DATABASE_URL=$DATABASE_URL_CHAT
npx prisma migrate dev --name init
```

Или используйте корневой Makefile:
```bash
cd ../../../../  # вернуться в корень
make migrate
```

### 5. Загрузка данных

#### Вариант A: Использовать SQL дамп (рекомендуется для search_db)

```bash
make load-dump
```

Это загрузит 81,823 спецификаций автомобилей из `cars.xml` в search_db.

#### Вариант B: Использовать seed скрипты

```bash
# Только users_db и chat_db
cd database
npm run seed:users
npm run seed:chat

# Для search_db используйте load-dump
```

## 📊 Данные

### Users Database
- **1 admin**: admin@cars.ru / admin123
- **3 test users**:
  - ivan@example.com / password123
  - maria@example.com / password123
  - alex@example.com / password123

### Search Database (после load-dump)
- **11 стран**
- **18 городов**
- **407 брендов**
- **9,554 моделей**
- **81,823 спецификаций** (полные характеристики из cars.xml)

### Chat Database
- Пустая база (заполняется в процессе работы)

## 🔧 Команды

### Из корня проекта (Makefile)

```bash
make migrate      # Применить миграции
make seed         # Загрузить seed данные
make load-dump    # Загрузить SQL дамп
make parse-xml    # Пересоздать дамп из cars.xml
make backup       # Создать резервную копию
make restore FILE=backup.tar.gz  # Восстановить из копии
```

### Из database директории (npm)

```bash
npm run seed:users    # Заполнить users_db
npm run seed:search   # Проверить search_db
npm run seed:chat     # Подготовить chat_db
npm run seed:all      # Все вместе
```

### Прямые скрипты

```bash
cd database/scripts

# Парсинг и загрузка
node parse-cars-xml.js      # Создать дамп из XML
./load-dump.sh              # Загрузить дамп

# Резервное копирование
./backup.sh                 # Создать backup
./restore.sh backup.tar.gz  # Восстановить

# Сброс (ОСТОРОЖНО!)
./reset-all.sh              # Удалить все данные
```

## 🔍 Проверка данных

### Через psql

```bash
# Подключиться к БД
docker exec -it cars_postgres psql -U postgres

# В psql:
\c search_db
SELECT COUNT(*) FROM "Brand";           -- 407
SELECT COUNT(*) FROM "Model";           -- 9,554
SELECT COUNT(*) FROM "Specification";   -- 81,823

# Примеры данных
SELECT b.name, m.name, s.horsepower
FROM "Specification" s
JOIN "Model" m ON s."modelId" = m.id
JOIN "Brand" b ON m."brandId" = b.id
LIMIT 10;

# Топ-10 мощных
SELECT b.name, m.name, s.horsepower
FROM "Specification" s
JOIN "Model" m ON s."modelId" = m.id
JOIN "Brand" b ON m."brandId" = b.id
ORDER BY s.horsepower DESC
LIMIT 10;
```

### Через PgAdmin

```bash
# Открыть PgAdmin
http://localhost:5050

# Login: admin@cars.ru / admin
# Add Server:
#   Host: postgres
#   Port: 5432
#   Username: postgres
#   Password: postgres
```

### Через Redis CLI

```bash
docker exec -it cars_redis redis-cli

# В redis-cli:
PING                # Проверка
KEYS *              # Все ключи
INFO                # Информация
```

## 💾 Резервное копирование

### Автоматический backup

```bash
make backup
```

Создаст файл `database/backups/YYYYMMDD_HHMMSS.tar.gz` со всеми тремя БД.

### Восстановление

```bash
make restore FILE=database/backups/20260203_120000.tar.gz
```

## 🔄 Обновление данных

### Обновить cars.xml данные

```bash
# 1. Заменить файл
cp /path/to/new/cars.xml ./cars.xml

# 2. Пересоздать дамп
make parse-xml

# 3. Сделать backup текущих данных
make backup

# 4. Загрузить новый дамп
make load-dump
```

### Сбросить все и начать с нуля

```bash
cd database/scripts
./reset-all.sh      # Подтверждение: DELETE ALL DATA
cd ../..
make migrate
make load-dump
make seed
```

## ⚙️ Конфигурация

### PostgreSQL (docker/postgres/postgresql.conf)
- max_connections: 100
- shared_buffers: 256MB
- Логирование всех запросов
- UTF-8 encoding
- Русский full-text search

### Redis (docker/redis/redis.conf)
- maxmemory: 256MB
- maxmemory-policy: allkeys-lru
- Persistence: RDB + AOF
- 16 databases

## 🐛 Решение проблем

### PostgreSQL не запускается

```bash
docker-compose logs postgres
docker-compose restart postgres
```

### Redis не подключается

```bash
docker exec -it cars_redis redis-cli PING
docker-compose restart redis
```

### Ошибки миграций

```bash
# Сбросить и пересоздать
cd database/scripts
./reset-all.sh
cd ../..
make migrate
```

### Дамп не загружается

```bash
# Проверить наличие файла
ls -lh database/dumps/initial-data.sql

# Пересоздать
make parse-xml

# Попробовать снова
make load-dump
```

## 📚 Дополнительная документация

- `DATA-LOADING.md` - Подробная инструкция по загрузке данных
- `dumps/README.md` - Описание SQL дампа
- `DATABASE-SETUP-RU.md` (корень) - Полная инструкция на русском

## ✅ Чек-лист настройки

- [ ] Docker Desktop запущен
- [ ] `npm install` в database/
- [ ] `.env` файл создан
- [ ] PostgreSQL контейнер запущен и healthy
- [ ] Redis контейнер запущен и healthy
- [ ] Миграции применены (make migrate)
- [ ] Дамп загружен (make load-dump)
- [ ] Seed скрипты выполнены (make seed)
- [ ] Данные проверены через PgAdmin

## 🎯 Следующие шаги

После настройки базы данных:

1. Перейти к настройке backend сервисов
2. Настроить LLM Orchestrator
3. Настроить Frontend
4. Запустить полное приложение: `make start`

База данных готова! 🚀
