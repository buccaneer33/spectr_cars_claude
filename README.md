# 🚗 Cars AI Consultant

Интеллектуальный консультант по подбору автомобилей с AI-ассистентом.

## Быстрый старт

### Первый запуск (инициализация):

```bash
# 1. Создать .env из примера
cp .env.example .env

# 2. Добавить свой OpenAI API ключ в .env
nano .env  # Изменить OPENAI_API_KEY

# 3. Инициализация проекта (создаст БД, применит миграции, засеет данные)
make init

# 4. Открыть приложение
# Frontend: http://localhost:3000
# PgAdmin:  http://localhost:5050 (admin@cars.ru / admin)
```

### Ежедневное использование:

```bash
# Запуск
make start

# Просмотр логов
make logs

# Остановка
make stop

# Помощь
make help
```

## Архитектура

```
┌─────────────┐
│   Frontend  │  React 19 + TypeScript + Ant Design
│  (port 3000)│
└──────┬──────┘
       │
┌──────▼──────┐
│    Nginx    │  API Gateway + Load Balancer
│  (port 80)  │
└──────┬──────┘
       │
       ├─────────┬──────────┬──────────┐
       │         │          │          │
┌──────▼────┐ ┌─▼────┐ ┌───▼───┐ ┌───▼────────┐
│User Service│ │Search│ │Chat   │ │LLM         │
│ (port 4001)│ │(4002)│ │(4003) │ │Orchestrator│
└──────┬─────┘ └─┬────┘ └───┬───┘ │(port 8080) │
       │         │          │     └─────┬──────┘
       └─────────┴──────────┴───────────┘
                      │
             ┌────────┴────────┐
             │                 │
        ┌────▼─────┐    ┌─────▼─────┐
        │PostgreSQL│    │   Redis   │
        │(port 5432)│    │(port 6379)│
        └──────────┘    └───────────┘
```

## Технологии

### Frontend
- React 19 (useOptimistic, useActionState)
- TypeScript
- Vite
- Ant Design
- TanStack Query
- Zustand

### Backend
- Node.js 20
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL 16
- Redis 7

### AI
- OpenAI GPT-4 Turbo
- Function Calling
- Context Management

## Структура проекта

```
cars/
├── frontend/           # React приложение
├── backend/
│   ├── services/
│   │   ├── users/     # User Service (auth, profiles)
│   │   ├── search/    # Search Service (car catalog)
│   │   └── chat/      # Chat Service (dialog management)
│   └── shared/        # Общий код для сервисов
├── llm-orchestrator/  # AI Gateway
├── database/          # Prisma схемы, seeds, scripts
├── infrastructure/    # Nginx, docker configs, scripts
├── docker-compose.yml # Единая конфигурация для всех сервисов
├── Makefile          # Команды для управления
└── .env.example      # Пример переменных окружения
```

## Доступные команды

```bash
make init          # Первичная инициализация
make start         # Запуск всех сервисов
make stop          # Остановка
make restart       # Перезапуск
make logs          # Просмотр логов
make logs SERVICE=llm-orchestrator  # Логи конкретного сервиса
make ps            # Статус контейнеров
make health        # Проверка здоровья сервисов
make migrate       # Применить миграции БД
make seed          # Засеять данные
make backup        # Backup баз данных
make clean         # Удалить всё (ОСТОРОЖНО!)
make help          # Показать все команды
```

## Environment Variables

Основные переменные в `.env`:

```env
# Обязательные
OPENAI_API_KEY=sk-...          # Ключ OpenAI API

# Опциональные (имеют defaults)
OPENAI_MODEL=gpt-4-turbo-preview
JWT_SECRET=your-secret-key
POSTGRES_PASSWORD=postgres
NODE_ENV=development
```

## Development Tools

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:80
- **PgAdmin**: http://localhost:5050 (admin@cars.ru / admin)
- **Redis Commander**: http://localhost:8081

## Тестовые пользователи

После `make seed`:

- **Admin**: admin@cars.ru / admin123
- **User 1**: ivan@example.com / password123
- **User 2**: maria@example.com / password123

## Troubleshooting

### Порт уже занят

```bash
# Найти процесс
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

### БД не отвечает

```bash
# Проверить статус
docker-compose ps postgres

# Перезапустить
docker-compose restart postgres
```

### Просмотр логов ошибок

```bash
# Все логи
make logs

# Конкретный сервис
make logs SERVICE=llm-orchestrator
```

### Полная переустановка

```bash
make clean
make init
```

## Документация

Детальная документация для каждого компонента находится в файлах `CLAUDE.md`:

- [Frontend](./frontend/CLAUDE.md) - React приложение
- [Backend](./backend/CLAUDE.md) - Микросервисы
- [Database](./database/CLAUDE.md) - БД схемы и seeds
- [LLM Orchestrator](./llm-orchestrator/CLAUDE.md) - AI интеграция
- [Infrastructure](./infrastructure/CLAUDE.md) - Docker и деплой

## License

MIT

## Contributing

Pull requests are welcome!
