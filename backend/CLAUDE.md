# Backend - Микросервисная система на Node.js

Создай микросервисную backend-систему с тремя сервисами: User Service, Search Service, Chat Service.

## Порядок создания:

1. **Сначала создай shared модуль** - общие типы, middleware, утилиты
2. **Настрой структуру каждого сервиса** - folders, package.json, tsconfig
3. **Создай Prisma схемы** для каждого сервиса (см. ниже)
4. **Реализуй middleware** - JWT auth, error handling, validation
5. **Создай routes, controllers, services** для каждого сервиса
6. **Настрой Nginx Gateway** - конфигурация проксирования
7. **Создай Docker конфигурацию** - Dockerfile для каждого сервиса и docker-compose.yml

## Технологии:

- Node.js 20+
- Express 4.18+ (НЕ Express 5)
- TypeScript 5.6+
- Prisma ORM 5.20+
- PostgreSQL 16
- Redis 7
- JWT для аутентификации
- Zod для валидации
- Winston для логирования

## Архитектура:

```
backend/
├── shared/                     # Общий код для всех сервисов
│   ├── src/
│   │   ├── types/             # Общие TypeScript типы
│   │   │   ├── api.ts         # API типы (совместимые с frontend)
│   │   │   └── database.ts    # Общие DB типы
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT проверка
│   │   │   ├── error-handler.ts
│   │   │   ├── validator.ts   # Zod validation middleware
│   │   │   └── logger.ts      # Winston logger
│   │   ├── utils/
│   │   │   ├── jwt.ts         # JWT функции
│   │   │   ├── password.ts    # Bcrypt хэширование
│   │   │   ├── redis.ts       # Redis клиент
│   │   │   └── response.ts    # Unified response format
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── services/
│   ├── users/                 # User Service (порт 4001)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── profile.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── profile.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── profile.service.ts
│   │   │   ├── validators/
│   │   │   │   └── auth.validator.ts
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   ├── search/                # Search Service (порт 4002)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── search.routes.ts
│   │   │   ├── controllers/
│   │   │   │   └── search.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── search.service.ts
│   │   │   │   └── cache.service.ts
│   │   │   ├── validators/
│   │   │   │   └── search.validator.ts
│   │   │   └── index.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   │
│   └── chat/                  # Chat Service (порт 4003)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── sessions.routes.ts
│       │   │   └── messages.routes.ts
│       │   ├── controllers/
│       │   │   ├── sessions.controller.ts
│       │   │   └── messages.controller.ts
│       │   ├── services/
│       │   │   ├── chat.service.ts
│       │   │   └── llm-client.service.ts
│       │   ├── validators/
│       │   │   └── chat.validator.ts
│       │   └── index.ts
│       ├── prisma/
│       │   └── schema.prisma
│       ├── Dockerfile
│       ├── package.json
│       └── .env.example
│
├── gateway/
│   ├── nginx.conf
│   └── Dockerfile
│
└── docker-compose.yml

```

---

## ПРИМЕРЫ КОДА

### 1. Shared Types (shared/src/types/api.ts):

```typescript
// Базовый формат всех API ответов
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// User
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
}

export interface UserProfile {
  userId: string;
  preferredBudgetMinRub: number | null;
  preferredBudgetMaxRub: number | null;
  preferredBodyTypeId: string | null;
  preferredFuelTypeId: string | null;
  cityId: string | null;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Chat
export interface ChatSession {
  id: string;
  userId: string | null;
  title: string;
  contextSummary: any | null;
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  finishedAt: Date | null;
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: any | null;
  createdAt: Date;
}

// Search
export interface SearchFilters {
  budget_max?: number;
  budget_min?: number;
  body_type?: string;
  fuel_type?: string;
  brand?: string;
  year_min?: number;
  year_max?: number;
}

export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  engineVolumeL: number;
  horsepower: number;
  fuelConsumption: number;
  insuranceCostPerYearRub: number;
  annualTaxCostRub: number;
  maintenanceCostPerYearRub: number;
}

export interface SearchResult {
  models: CarModel[];
  total: number;
}
```

### 2. Unified Response (shared/src/utils/response.ts):

```typescript
import { ApiResponse } from '../types/api';

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code: string, message: string): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}
```

### 3. JWT Utils (shared/src/utils/jwt.ts):

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
```

### 4. Password Utils (shared/src/utils/password.ts):

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 5. Auth Middleware (shared/src/middleware/auth.ts):

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Проверяем JWT в cookie или Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json(errorResponse('UNAUTHORIZED', 'Token not provided'));
      return;
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid token'));
  }
}

export function optionalAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
    }
    next();
  } catch (error) {
    // Игнорируем ошибки для optional auth
    next();
  }
}
```

### 6. Error Handler Middleware (shared/src/middleware/error-handler.ts):

```typescript
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json(
      errorResponse(error.code, error.message)
    );
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json(
      errorResponse('DATABASE_ERROR', 'Database operation failed')
    );
    return;
  }

  // Default error
  res.status(500).json(
    errorResponse('INTERNAL_ERROR', 'Internal server error')
  );
}
```

### 7. Validator Middleware (shared/src/middleware/validator.ts):

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        );
        res.status(400).json(
          errorResponse('VALIDATION_ERROR', errorMessages.join(', '))
        );
        return;
      }
      next(error);
    }
  };
}
```

### 8. Logger (shared/src/middleware/logger.ts):

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
```

### 9. Redis Client (shared/src/utils/redis.ts):

```typescript
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
  await redisClient.connect();
  console.log('✅ Connected to Redis');
}

// Cache utilities
export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = 600
): Promise<void> {
  await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDelete(key: string): Promise<void> {
  await redisClient.del(key);
}
```

---

## PRISMA SCHEMAS

### User Service (services/users/prisma/schema.prisma):

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String      @map("password_hash")
  name         String?
  avatarUrl    String?     @map("avatar_url")
  role         UserRole    @default(USER)
  status       UserStatus  @default(ACTIVE)
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  profile      UserProfile?

  @@map("users")
}

model UserProfile {
  userId                  String   @id @map("user_id")
  preferredBudgetMinRub   Decimal? @map("preferred_budget_min_rub") @db.Decimal(12, 2)
  preferredBudgetMaxRub   Decimal? @map("preferred_budget_max_rub") @db.Decimal(12, 2)
  preferredBodyTypeId     String?  @map("preferred_body_type_id")
  preferredFuelTypeId     String?  @map("preferred_fuel_type_id")
  cityId                  String?  @map("city_id")
  updatedAt               DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  BLOCKED
  PENDING
}
```

### Search Service (services/search/prisma/schema.prisma):

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Справочники
model Country {
  id      String  @id @default(uuid())
  name    String
  isoCode String  @unique @map("iso_code") @db.Char(2)

  cities  City[]
  brands  Brand[]

  @@map("countries")
}

model City {
  id        String  @id @default(uuid())
  countryId String  @map("country_id")
  name      String

  country Country @relation(fields: [countryId], references: [id])

  @@map("cities")
}

model Brand {
  id        String   @id @default(uuid())
  name      String   @unique
  countryId String   @map("country_id")
  createdAt DateTime @default(now()) @map("created_at")

  country Country @relation(fields: [countryId], references: [id])
  models  Model[]

  @@index([name])
  @@map("brands")
}

model Model {
  id                   String   @id @default(uuid())
  brandId              String   @map("brand_id")
  name                 String
  generation           String?
  productionStartYear  Int      @map("production_start_year")
  productionEndYear    Int?     @map("production_end_year")
  averagePriceRub      Decimal? @map("average_price_rub") @db.Decimal(12, 2)
  createdAt            DateTime @default(now()) @map("created_at")

  brand          Brand                 @relation(fields: [brandId], references: [id])
  specifications ModelSpecification[]

  @@map("models")
}

model BodyType {
  id   String @id @default(uuid())
  name String @unique
  code String @unique

  specifications ModelSpecification[]

  @@map("body_types")
}

model FuelType {
  id   String @id @default(uuid())
  name String @unique
  code String @unique

  specifications ModelSpecification[]

  @@map("fuel_types")
}

model Transmission {
  id   String @id @default(uuid())
  name String @unique
  code String @unique

  specifications ModelSpecification[]

  @@map("transmissions")
}

model DriveType {
  id   String @id @default(uuid())
  name String @unique
  code String @unique

  specifications ModelSpecification[]

  @@map("drive_types")
}

// Характеристики модели
model ModelSpecification {
  id                         String   @id @default(uuid())
  modelId                    String   @map("model_id")
  bodyTypeId                 String   @map("body_type_id")
  fuelTypeId                 String   @map("fuel_type_id")
  transmissionId             String   @map("transmission_id")
  driveTypeId                String   @map("drive_type_id")
  engineVolumeL              Decimal? @map("engine_volume_l") @db.Decimal(3, 1)
  horsepower                 Int?
  fuelConsumptionCombined    Decimal? @map("fuel_consumption_combined") @db.Decimal(4, 1)
  insuranceCostPerYearRub    Decimal? @map("insurance_cost_per_year_rub") @db.Decimal(10, 2)
  annualTaxCostRub           Decimal? @map("annual_tax_cost_rub") @db.Decimal(10, 2)
  maintenanceCostPerYearRub  Decimal? @map("maintenance_cost_per_year_rub") @db.Decimal(10, 2)
  isActive                   Boolean  @default(true) @map("is_active")
  createdAt                  DateTime @default(now()) @map("created_at")
  updatedAt                  DateTime @updatedAt @map("updated_at")

  model        Model        @relation(fields: [modelId], references: [id])
  bodyType     BodyType     @relation(fields: [bodyTypeId], references: [id])
  fuelType     FuelType     @relation(fields: [fuelTypeId], references: [id])
  transmission Transmission @relation(fields: [transmissionId], references: [id])
  driveType    DriveType    @relation(fields: [driveTypeId], references: [id])

  @@index([modelId, fuelTypeId, isActive])
  @@map("model_specifications")
}

model ComparisonCriteria {
  id          String  @id @default(uuid())
  code        String  @unique
  name        String
  description String?
  units       String?
  priority    Int
  isActive    Boolean @default(true) @map("is_active")

  @@map("comparison_criteria")
}
```

### Chat Service (services/chat/prisma/schema.prisma):

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ChatSession {
  id             String            @id @default(uuid())
  userId         String?           @map("user_id")
  title          String            @default("Новый диалог") @db.VarChar(255)
  contextSummary Json?             @map("context_summary")
  status         ChatSessionStatus @default(active)
  createdAt      DateTime          @default(now()) @map("created_at")
  finishedAt     DateTime?         @map("finished_at")

  messages     ChatMessage[]
  searchResult SearchResult?

  @@index([userId, status])
  @@map("chat_sessions")
}

model ChatMessage {
  id            String          @id @default(uuid())
  chatSessionId String          @map("chat_session_id")
  role          ChatMessageRole
  content       String          @db.Text
  metadata      Json?
  createdAt     DateTime        @default(now()) @map("created_at")

  chatSession ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)

  @@index([chatSessionId, createdAt])
  @@map("chat_messages")
}

model SearchResult {
  id                  String   @id @default(uuid())
  chatSessionId       String   @unique @map("chat_session_id")
  userId              String   @map("user_id")
  searchQuerySummary  String?  @map("search_query_summary") @db.Text
  resultData          Json     @map("result_data")
  isSaved             Boolean  @default(false) @map("is_saved")
  createdAt           DateTime @default(now()) @map("created_at")

  chatSession ChatSession @relation(fields: [chatSessionId], references: [id], onDelete: Cascade)

  @@index([userId, isSaved])
  @@map("search_results")
}

enum ChatSessionStatus {
  active
  completed
  archived
}

enum ChatMessageRole {
  user
  assistant
  system
}
```

---

## USER SERVICE IMPLEMENTATION

### Auth Controller (services/users/src/controllers/auth.controller.ts):

```typescript
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '@shared/utils/response';
import { AppError } from '@shared/middleware/error-handler';
import type { LoginRequest, RegisterRequest } from '@shared/types/api';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
      const result = await this.authService.register(req.body);

      // Устанавливаем JWT в HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json(successResponse(result));
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          errorResponse(error.code, error.message)
        );
      } else {
        throw error;
      }
    }
  };

  login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    try {
      const result = await this.authService.login(req.body);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(successResponse(result));
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json(
          errorResponse(error.code, error.message)
        );
      } else {
        throw error;
      }
    }
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json(successResponse({ message: 'Logged out successfully' }));
  };
}
```

### Auth Service (services/users/src/services/auth.service.ts):

```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '@shared/utils/password';
import { signToken } from '@shared/utils/jwt';
import { AppError } from '@shared/middleware/error-handler';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@shared/types/api';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Проверяем существование пользователя
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Хэшируем пароль
    const passwordHash = await hashPassword(data.password);

    // Создаём пользователя с профилем
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    // Генерируем JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Ищем пользователя
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Проверяем статус
    if (user.status === 'BLOCKED') {
      throw new AppError('USER_BLOCKED', 'User account is blocked', 403);
    }

    // Проверяем пароль
    const isPasswordValid = await comparePassword(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Генерируем JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
      },
      token,
    };
  }
}
```

### Auth Validators (services/users/src/validators/auth.validator.ts):

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});
```

### Auth Routes (services/users/src/routes/auth.routes.ts):

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { validate } from '@shared/middleware/validator';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);
const authController = new AuthController(authService);

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

export default router;
```

### User Service Entry Point (services/users/src/index.ts):

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { errorHandler } from '@shared/middleware/error-handler';
import { logger } from '@shared/middleware/logger';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'user-service' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 User Service running on port ${PORT}`);
});
```

---

## SEARCH SERVICE IMPLEMENTATION

### Search Service (services/search/src/services/search.service.ts):

```typescript
import { PrismaClient } from '@prisma/client';
import { cacheGet, cacheSet } from '@shared/utils/redis';
import type { SearchFilters, CarModel, SearchResult } from '@shared/types/api';
import crypto from 'crypto';

export class SearchService {
  constructor(private prisma: PrismaClient) {}

  async searchCars(filters: SearchFilters): Promise<SearchResult> {
    // Создаём ключ кэша из фильтров
    const cacheKey = this.createCacheKey(filters);

    // Проверяем кэш
    const cached = await cacheGet<SearchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Строим WHERE условие
    const where: any = {
      isActive: true,
    };

    if (filters.body_type) {
      where.bodyType = { code: filters.body_type };
    }

    if (filters.fuel_type) {
      where.fuelType = { code: filters.fuel_type };
    }

    if (filters.brand) {
      where.model = {
        brand: {
          name: {
            contains: filters.brand,
            mode: 'insensitive',
          },
        },
      };
    }

    if (filters.budget_max) {
      where.model = {
        ...where.model,
        averagePriceRub: {
          lte: filters.budget_max,
        },
      };
    }

    if (filters.budget_min) {
      where.model = {
        ...where.model,
        averagePriceRub: {
          gte: filters.budget_min,
        },
      };
    }

    // Выполняем запрос
    const specifications = await this.prisma.modelSpecification.findMany({
      where,
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        bodyType: true,
        fuelType: true,
        transmission: true,
        driveType: true,
      },
      take: 10,
      orderBy: {
        model: {
          averagePriceRub: 'asc',
        },
      },
    });

    // Преобразуем в формат ответа
    const models: CarModel[] = specifications.map((spec) => ({
      id: spec.id,
      brand: spec.model.brand.name,
      model: spec.model.name,
      year: spec.model.productionStartYear,
      price: Number(spec.model.averagePriceRub || 0),
      bodyType: spec.bodyType.name,
      fuelType: spec.fuelType.name,
      transmission: spec.transmission.name,
      driveType: spec.driveType.name,
      engineVolumeL: Number(spec.engineVolumeL || 0),
      horsepower: spec.horsepower || 0,
      fuelConsumption: Number(spec.fuelConsumptionCombined || 0),
      insuranceCostPerYearRub: Number(spec.insuranceCostPerYearRub || 0),
      annualTaxCostRub: Number(spec.annualTaxCostRub || 0),
      maintenanceCostPerYearRub: Number(spec.maintenanceCostPerYearRub || 0),
    }));

    const result: SearchResult = {
      models,
      total: models.length,
    };

    // Сохраняем в кэш на 10 минут
    await cacheSet(cacheKey, result, 600);

    return result;
  }

  async compareModels(modelIds: string[]): Promise<CarModel[]> {
    const specifications = await this.prisma.modelSpecification.findMany({
      where: {
        id: {
          in: modelIds,
        },
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        bodyType: true,
        fuelType: true,
        transmission: true,
        driveType: true,
      },
    });

    return specifications.map((spec) => ({
      id: spec.id,
      brand: spec.model.brand.name,
      model: spec.model.name,
      year: spec.model.productionStartYear,
      price: Number(spec.model.averagePriceRub || 0),
      bodyType: spec.bodyType.name,
      fuelType: spec.fuelType.name,
      transmission: spec.transmission.name,
      driveType: spec.driveType.name,
      engineVolumeL: Number(spec.engineVolumeL || 0),
      horsepower: spec.horsepower || 0,
      fuelConsumption: Number(spec.fuelConsumptionCombined || 0),
      insuranceCostPerYearRub: Number(spec.insuranceCostPerYearRub || 0),
      annualTaxCostRub: Number(spec.annualTaxCostRub || 0),
      maintenanceCostPerYearRub: Number(spec.maintenanceCostPerYearRub || 0),
    }));
  }

  private createCacheKey(filters: SearchFilters): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(filters))
      .digest('hex');
    return `search:cars:${hash}`;
  }
}
```

---

## PACKAGE.JSON EXAMPLES

### Shared Package (shared/package.json):

```json
{
  "name": "@cars/shared",
  "version": "1.0.0",
  "description": "Shared utilities and types for Cars AI Consultant backend services",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "redis": "^4.6.12",
    "winston": "^3.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  }
}
```

### User Service Package (services/users/package.json):

```json
{
  "name": "@cars/user-service",
  "version": "1.0.0",
  "description": "User Service - Authentication and user management",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@cars/shared": "file:../../shared",
    "@prisma/client": "^5.20.0",
    "express": "^4.18.2",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cookie-parser": "^1.4.6",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.0.0",
    "prisma": "^5.20.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

---

## DOCKER CONFIGURATION

### User Service Dockerfile (services/users/Dockerfile):

**ВАЖНО:** Build context для всех backend сервисов — `./backend` (не индивидуальная папка сервиса).
В docker-compose.yml:
```yaml
user-service:
  build:
    context: ./backend
    dockerfile: services/users/Dockerfile
```

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy and build shared module
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install
COPY shared/ ./
RUN npm run build

# Setup service
WORKDIR /app/services/users
COPY services/users/package*.json ./
RUN npm install

# Copy source code
COPY services/users/ ./

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

EXPOSE 4001

CMD ["npm", "start"]
```

### Nginx Gateway Config (gateway/nginx.conf):

```nginx
events {
    worker_connections 1024;
}

http {
    upstream user_service {
        server users:4001;
    }

    upstream search_service {
        server search:4002;
    }

    upstream chat_service {
        server chat:4003;
    }

    server {
        listen 80;
        server_name localhost;

        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        # OPTIONS preflight
        if ($request_method = OPTIONS) {
            return 204;
        }

        # User Service
        location /api/auth/ {
            proxy_pass http://user_service/api/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location /api/users/ {
            proxy_pass http://user_service/api/users/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Search Service
        location /api/search/ {
            proxy_pass http://search_service/api/search/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Chat Service
        location /api/chat/ {
            proxy_pass http://chat_service/api/chat/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health checks
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### Docker Compose (docker-compose.yml):

```yaml
version: '3.8'

services:
  # Databases
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Services
  users:
    build:
      context: ./services/users
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/users_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key-change-in-production
      PORT: 4001
    ports:
      - "4001:4001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  search:
    build:
      context: ./services/search
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/search_db
      REDIS_URL: redis://redis:6379
      PORT: 4002
    ports:
      - "4002:4002"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  chat:
    build:
      context: ./services/chat
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/chat_db
      REDIS_URL: redis://redis:6379
      USER_SERVICE_URL: http://users:4001
      SEARCH_SERVICE_URL: http://search:4002
      PORT: 4003
    ports:
      - "4003:4003"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Gateway
  gateway:
    image: nginx:alpine
    volumes:
      - ./gateway/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - users
      - search
      - chat

volumes:
  postgres_data:
  redis_data:
```

### Init Databases Script (scripts/init-databases.sql):

```sql
-- Создаём отдельные базы для каждого сервиса
CREATE DATABASE users_db;
CREATE DATABASE search_db;
CREATE DATABASE chat_db;
```

---

## ENVIRONMENT VARIABLES

### User Service (.env.example):

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server
PORT=4001
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## КРИТИЧЕСКИ ВАЖНО:

1. **Shared модуль** - создай первым, остальные сервисы зависят от него
2. **Prisma schemas** - используй ТОЧНЫЕ схемы из примеров выше
3. **Unified Response Format** - все API должны возвращать `{ success, data, error }`
4. **JWT в HttpOnly cookies** - безопасность
5. **Redis кэширование** - обязательно для поиска (TTL 10 мин)
6. **Error handling** - централизованный через middleware
7. **Validation** - через Zod для всех входящих данных
8. **Health checks** - для каждого сервиса
9. **CORS** - правильная настройка с credentials
10. **Logging** - Winston для всех сервисов
11. **npm install** - всегда использовать `npm install` вместо `npm ci`, так как package-lock.json может отсутствовать
12. **.dockerignore** - ОБЯЗАТЕЛЬНО создавать в корне контекста сборки Docker для исключения node_modules, dist и других ненужных файлов. Без этого build context будет очень большим и сборка займёт много времени

## ПОРЯДОК ЗАПУСКА:

```bash
# 1. Запустить инфраструктуру
docker-compose up postgres redis -d

# 2. Применить миграции для каждого сервиса
cd services/users && npx prisma migrate dev
cd services/search && npx prisma migrate dev
cd services/chat && npx prisma migrate dev

# 3. Засеять данные (brands, models, specifications)
npm run seed

# 4. Запустить сервисы
docker-compose up
```
