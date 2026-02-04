# Backend Services - Cars AI Consultant

Микросервисная архитектура на Node.js + TypeScript + Express + Prisma.

## 🏗️ Архитектура

```
backend/
├── shared/                  # Общий код для всех сервисов
│   ├── types/              # TypeScript типы
│   ├── utils/              # Утилиты (JWT, password, redis, response)
│   └── middleware/         # Middleware (auth, error-handler, logger, validator)
│
└── services/
    ├── users/              # User Service (4001) - Auth + Profile
    ├── search/             # Search Service (4002) - Car search
    └── chat/               # Chat Service (4003) - AI chat
```

## 📦 Сервисы

### 1. User Service (PORT 4001)
**Назначение:** Аутентификация и управление пользователями

**API Endpoints:**
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь
- `GET /api/users/profile` - Получить профиль
- `PUT /api/users/profile` - Обновить профиль

**Технологии:**
- JWT authentication
- Bcrypt password hashing
- Cookie-based sessions
- Prisma ORM

### 2. Search Service (PORT 4002)
**Назначение:** Поиск и фильтрация автомобилей

**API Endpoints:**
- `GET /api/search/cars` - Поиск автомобилей
  - Query params: `budget_min`, `budget_max`, `brand`, `body_type`, `fuel_type`, `year_min`, `year_max`
- `GET /api/search/brands` - Список брендов
- `GET /api/search/body-types` - Типы кузова
- `GET /api/search/fuel-types` - Типы топлива

**Возможности:**
- Фильтрация по цене, бренду, типу кузова, топливу, году
- Пагинация результатов
- Кэширование через Redis
- 81,823 спецификаций в базе

### 3. Chat Service (PORT 4003)
**Назначение:** Управление чат-сессиями с AI

**API Endpoints:**
- `POST /api/chat/sessions` - Создать сессию
- `GET /api/chat/sessions` - Список сессий
- `GET /api/chat/sessions/:id` - Получить сессию с сообщениями
- `POST /api/chat/:sessionId/messages` - Отправить сообщение

**Интеграция:**
- LLM Orchestrator для AI ответов
- Search Service для поиска автомобилей
- User Service для профилей

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Shared module
cd backend/shared
npm install
npm run build

# User Service
cd ../services/users
npm install

# Search Service
cd ../search
npm install

# Chat Service
cd ../chat
npm install
```

### 2. Настройка окружения

Создайте `.env` файлы в каждом сервисе:

```bash
# Users
cd backend/services/users
cp .env.example .env
# Отредактируйте DATABASE_URL, JWT_SECRET

# Search
cd ../search
cp .env.example .env
# Отредактируйте DATABASE_URL

# Chat
cd ../chat
cp .env.example .env
# Отредактируйте DATABASE_URL, LLM_ORCHESTRATOR_URL
```

### 3. Prisma миграции

```bash
# User Service
cd backend/services/users
npx prisma generate
npx prisma migrate dev

# Search Service
cd ../search
npx prisma generate
npx prisma migrate dev

# Chat Service
cd ../chat
npx prisma generate
npx prisma migrate dev
```

### 4. Запуск сервисов (Development)

Откройте 3 терминала:

```bash
# Terminal 1: User Service
cd backend/services/users
npm run dev

# Terminal 2: Search Service
cd backend/services/search
npm run dev

# Terminal 3: Chat Service
cd backend/services/chat
npm run dev
```

### 5. Проверка работы

```bash
# User Service
curl http://localhost:4001/health

# Search Service
curl http://localhost:4002/health

# Chat Service
curl http://localhost:4003/health
```

## 🐳 Docker Deployment

Используйте корневой `docker-compose.yml`:

```bash
# Из корня проекта
docker-compose up -d

# Или через Makefile
make start
```

## 📚 Shared Module

Общий код для всех сервисов находится в `backend/shared/`:

### Types (`@cars/shared`)
```typescript
import {
  ApiResponse,
  User,
  UserProfile,
  ChatSession,
  ChatMessage,
  SearchFilters,
} from '@cars/shared';
```

### Utils
```typescript
import {
  successResponse,
  errorResponse,
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getRedisClient,
} from '@cars/shared';
```

### Middleware
```typescript
import {
  authMiddleware,
  optionalAuth,
  adminOnly,
  errorHandler,
  requestLogger,
  validateBody,
  validateQuery,
} from '@cars/shared';
```

## 🔧 Разработка

### Добавление нового endpoint

1. Создайте валидатор в `validators/`
2. Реализуйте сервис в `services/`
3. Создайте контроллер в `controllers/`
4. Добавьте маршрут в `routes/`

Пример (User Service):

```typescript
// validators/user.validator.ts
export const updateUserSchema = z.object({
  name: z.string().min(1),
});

// services/user.service.ts
export class UserService {
  async updateUser(userId: string, data: any) {
    return prisma.user.update({ where: { id: userId }, data });
  }
}

// controllers/user.controller.ts
export class UserController {
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId;
      const result = await userService.updateUser(userId, req.body);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

// routes/user.routes.ts
router.put('/me', authMiddleware, validateBody(updateUserSchema),
  (req, res, next) => userController.updateUser(req, res, next)
);
```

## 🧪 Testing

```bash
# Unit tests (TODO)
npm test

# Integration tests (TODO)
npm run test:integration

# E2E tests (TODO)
npm run test:e2e
```

## 📊 Monitoring & Logging

Все сервисы используют Winston для логирования:

```typescript
import { logger } from '@cars/shared';

logger.info('User registered', { userId, email });
logger.error('Database error', { error });
```

## 🔒 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ CORS configuration
- ✅ Input validation (Zod)
- ✅ Error handling
- ✅ HTTP-only cookies
- ✅ Rate limiting (через Nginx)

## 🚨 Error Handling

Используйте `AppError` для бизнес-логики ошибок:

```typescript
import { AppError } from '@cars/shared';

if (!user) {
  throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
}
```

Коды ошибок:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `INTERNAL_ERROR` (500)

## 📝 Environment Variables

### Common
- `PORT` - Порт сервиса
- `NODE_ENV` - development | production
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### User Service
- `JWT_SECRET` - Secret key for JWT
- `FRONTEND_URL` - Frontend URL for CORS

### Chat Service
- `LLM_ORCHESTRATOR_URL` - URL LLM Orchestrator
- `USER_SERVICE_URL` - URL User Service
- `SEARCH_SERVICE_URL` - URL Search Service

## 🏁 Production Checklist

- [ ] Изменить `JWT_SECRET` на криптостойкий ключ
- [ ] Настроить HTTPS
- [ ] Настроить rate limiting
- [ ] Настроить monitoring (Prometheus + Grafana)
- [ ] Настроить centralized logging (ELK)
- [ ] Настроить автоматические backups БД
- [ ] Запустить через PM2 или Docker Swarm/Kubernetes
- [ ] Настроить CI/CD pipeline
- [ ] Добавить health checks
- [ ] Настроить alerting

## 🤝 API Communication

```
┌─────────────┐
│  Frontend   │
│ (Port 3000) │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    Nginx    │ ← API Gateway (Port 80)
│   Gateway   │
└──────┬──────┘
       │
       ├────────────┬────────────┬────────────┐
       ↓            ↓            ↓            ↓
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐
│   User     │ │   Search   │ │    Chat    │ │      LLM       │
│  Service   │ │  Service   │ │  Service   │ │ Orchestrator   │
│ (Port 4001)│ │ (Port 4002)│ │ (Port 4003)│ │  (Port 8080)   │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────────────────┘
      │              │              │
      ├──────────────┴──────────────┤
      │                             │
      ↓                             ↓
┌──────────────┐            ┌──────────────┐
│  PostgreSQL  │            │    Redis     │
│  (Port 5432) │            │ (Port 6379)  │
│              │            │              │
│ - users_db   │            │ - Cache      │
│ - search_db  │            │ - Sessions   │
│ - chat_db    │            │              │
└──────────────┘            └──────────────┘
```

## ✅ Completed Features

- ✅ Shared module с типами и утилитами
- ✅ User Service (auth, profile)
- ✅ Search Service (поиск автомобилей)
- ✅ Chat Service (AI чат-сессии)
- ✅ Prisma ORM интеграция
- ✅ JWT authentication
- ✅ Input validation (Zod)
- ✅ Error handling
- ✅ Logging (Winston)
- ✅ CORS configuration
- ✅ Docker configuration

## 🔜 TODO

- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Rate limiting middleware
- [ ] Request caching
- [ ] Metrics collection
- [ ] Admin panel endpoints
- [ ] User roles & permissions
- [ ] Password reset flow
- [ ] Email verification

---

**Backend готов к работе!** 🚀

Все сервисы реализованы согласно `backend/CLAUDE.md`.
