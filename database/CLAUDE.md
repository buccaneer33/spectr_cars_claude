# Database - PostgreSQL + Redis конфигурация

Настрой базы данных для микросервисной архитектуры с тремя отдельными PostgreSQL базами и Redis для кэширования.

## Порядок настройки:

1. **Создай структуру папок** - schemas, migrations, seeds, scripts
2. **Настрой Docker** - PostgreSQL + Redis с правильной конфигурацией
3. **Создай Prisma схемы** для каждого сервиса (ТОЧНО как в backend/CLAUDE.md)
4. **Напиши seed скрипты** - наполнение справочников и тестовых данных
5. **Создай init скрипты** - автоматическое создание баз данных
6. **Добавь backup/restore** - скрипты для резервного копирования
7. **Парсинг XML** - скрипт для парсинга cars.xml в SQL dump
8. **Загрузка dump** - скрипт для загрузки SQL dump в search_db

## Архитектура:

```
database/
├── schemas/                    # Prisma схемы (копии из services)
│   ├── user-service.prisma    # User + UserProfile
│   ├── search-service.prisma  # Каталог автомобилей
│   └── chat-service.prisma    # Чат и результаты поиска
│
├── seeds/                     # Seed данные для каждого сервиса
│   ├── users/
│   │   └── seed.ts           # Тестовые пользователи
│   ├── search/
│   │   ├── seed.ts           # Справочники + модели
│   │   ├── data/
│   │   │   ├── countries.json
│   │   │   ├── cities.json
│   │   │   ├── brands.json
│   │   │   ├── body-types.json
│   │   │   ├── fuel-types.json
│   │   │   ├── transmissions.json
│   │   │   ├── drive-types.json
│   │   │   └── models.json
│   │   └── README.md
│   └── chat/
│       └── seed.ts           # Критерии сравнения
│
├── migrations/               # История миграций
│   ├── users/
│   ├── search/
│   └── chat/
│
├── scripts/
│   ├── init-databases.sql   # Создание баз данных
│   ├── parse-cars-xml.js    # Парсинг cars.xml → SQL dump
│   ├── load-dump.sh         # Загрузка SQL dump в search_db
│   ├── backup.sh            # Резервное копирование
│   ├── restore.sh           # Восстановление
│   └── reset-all.sh         # Сброс всех БД (dev only)
│
├── docker/
│   ├── postgres/
│   │   ├── Dockerfile
│   │   └── postgresql.conf
│   └── redis/
│       ├── Dockerfile
│       └── redis.conf
│
├── package.json
├── tsconfig.json
└── .env.example
```

## Загрузка данных из cars.xml

Файл `cars.xml` (~48MB) содержит полную базу автомобилей. Для загрузки данных:

```bash
# 1. Парсинг XML в SQL dump
cd database/scripts && node parse-cars-xml.js

# 2. Загрузка dump в search_db
chmod +x database/scripts/load-dump.sh
./database/scripts/load-dump.sh

# Или через Makefile из корня проекта:
make parse-xml
make load-dump
```

---

## PRISMA SCHEMAS (синхронизированы с backend)

### 1. User Service Schema (schemas/user-service.prisma):

```prisma
// ВАЖНО: Это ТОЧНАЯ копия из backend/services/users/prisma/schema.prisma
// Любые изменения должны синхронизироваться!

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-users"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_USERS")
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

### 2. Search Service Schema (schemas/search-service.prisma):

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-search"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_SEARCH")
}

// === СПРАВОЧНИКИ ===

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

  @@index([countryId])
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

  @@index([brandId])
  @@index([name])
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

// === ХАРАКТЕРИСТИКИ МОДЕЛЕЙ ===

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

  // Индексы для оптимизации поиска
  @@index([modelId, isActive])
  @@index([bodyTypeId, fuelTypeId, isActive])
  @@map("model_specifications")
}

// === КРИТЕРИИ СРАВНЕНИЯ ===

model ComparisonCriteria {
  id          String  @id @default(uuid())
  code        String  @unique
  name        String
  description String?
  units       String?
  priority    Int
  isActive    Boolean @default(true) @map("is_active")

  @@index([priority])
  @@map("comparison_criteria")
}
```

### 3. Chat Service Schema (schemas/chat-service.prisma):

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client-chat"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_CHAT")
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
  @@index([createdAt])
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
  @@index([createdAt])
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

## SEED SCRIPTS

### 1. Users Service Seed (seeds/users/seed.ts):

```typescript
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../../backend/shared/src/utils/password';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_USERS,
    },
  },
});

async function main() {
  console.log('🌱 Seeding users database...');

  // Очищаем данные
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Админ
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cars.ru',
      passwordHash: await hashPassword('admin123'),
      name: 'Администратор',
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {},
      },
    },
  });

  // Тестовые пользователи
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'ivan@example.com',
        passwordHash: await hashPassword('password123'),
        name: 'Иван Иванов',
        role: 'USER',
        status: 'ACTIVE',
        profile: {
          create: {
            preferredBudgetMinRub: 1000000,
            preferredBudgetMaxRub: 2000000,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@example.com',
        passwordHash: await hashPassword('password123'),
        name: 'Мария Петрова',
        role: 'USER',
        status: 'ACTIVE',
        profile: {
          create: {
            preferredBudgetMinRub: 2000000,
            preferredBudgetMaxRub: 3500000,
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length + 1} users`);
  console.log(`   Admin: admin@cars.ru / admin123`);
  console.log(`   Users: ivan@example.com, maria@example.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 2. Search Service Seed - Countries Data (seeds/search/data/countries.json):

```json
[
  { "name": "Россия", "isoCode": "RU" },
  { "name": "Германия", "isoCode": "DE" },
  { "name": "Япония", "isoCode": "JP" },
  { "name": "Южная Корея", "isoCode": "KR" },
  { "name": "США", "isoCode": "US" },
  { "name": "Франция", "isoCode": "FR" },
  { "name": "Италия", "isoCode": "IT" },
  { "name": "Чехия", "isoCode": "CZ" },
  { "name": "Швеция", "isoCode": "SE" },
  { "name": "Китай", "isoCode": "CN" }
]
```

### 3. Search Service Seed - Cities Data (seeds/search/data/cities.json):

```json
[
  { "countryIsoCode": "RU", "name": "Москва" },
  { "countryIsoCode": "RU", "name": "Санкт-Петербург" },
  { "countryIsoCode": "RU", "name": "Новосибирск" },
  { "countryIsoCode": "RU", "name": "Екатеринбург" },
  { "countryIsoCode": "RU", "name": "Казань" }
]
```

### 4. Search Service Seed - Brands Data (seeds/search/data/brands.json):

```json
[
  { "name": "Toyota", "countryIsoCode": "JP" },
  { "name": "BMW", "countryIsoCode": "DE" },
  { "name": "Mercedes-Benz", "countryIsoCode": "DE" },
  { "name": "Volkswagen", "countryIsoCode": "DE" },
  { "name": "Audi", "countryIsoCode": "DE" },
  { "name": "Honda", "countryIsoCode": "JP" },
  { "name": "Nissan", "countryIsoCode": "JP" },
  { "name": "Mazda", "countryIsoCode": "JP" },
  { "name": "Hyundai", "countryIsoCode": "KR" },
  { "name": "Kia", "countryIsoCode": "KR" },
  { "name": "Skoda", "countryIsoCode": "CZ" },
  { "name": "Volvo", "countryIsoCode": "SE" },
  { "name": "Ford", "countryIsoCode": "US" },
  { "name": "Chevrolet", "countryIsoCode": "US" },
  { "name": "Renault", "countryIsoCode": "FR" },
  { "name": "Peugeot", "countryIsoCode": "FR" },
  { "name": "Lada", "countryIsoCode": "RU" },
  { "name": "Haval", "countryIsoCode": "CN" },
  { "name": "Geely", "countryIsoCode": "CN" },
  { "name": "Chery", "countryIsoCode": "CN" }
]
```

### 5. Search Service Seed - Body Types (seeds/search/data/body-types.json):

```json
[
  { "name": "Седан", "code": "sedan" },
  { "name": "Хэтчбек", "code": "hatchback" },
  { "name": "Универсал", "code": "wagon" },
  { "name": "Внедорожник", "code": "suv" },
  { "name": "Кроссовер", "code": "crossover" },
  { "name": "Купе", "code": "coupe" },
  { "name": "Кабриолет", "code": "convertible" },
  { "name": "Минивэн", "code": "minivan" },
  { "name": "Пикап", "code": "pickup" },
  { "name": "Лифтбек", "code": "liftback" }
]
```

### 6. Search Service Seed - Fuel Types (seeds/search/data/fuel-types.json):

```json
[
  { "name": "Бензин", "code": "petrol" },
  { "name": "Дизель", "code": "diesel" },
  { "name": "Гибрид", "code": "hybrid" },
  { "name": "Электро", "code": "electric" },
  { "name": "Газ", "code": "gas" },
  { "name": "Бензин/Газ", "code": "petrol_gas" }
]
```

### 7. Search Service Seed - Transmissions (seeds/search/data/transmissions.json):

```json
[
  { "name": "Механическая", "code": "manual" },
  { "name": "Автоматическая", "code": "automatic" },
  { "name": "Роботизированная", "code": "robot" },
  { "name": "Вариатор", "code": "cvt" }
]
```

### 8. Search Service Seed - Drive Types (seeds/search/data/drive-types.json):

```json
[
  { "name": "Передний", "code": "fwd" },
  { "name": "Задний", "code": "rwd" },
  { "name": "Полный", "code": "awd" }
]
```

### 9. Search Service Seed - Models (seeds/search/data/models.json):

```json
[
  {
    "brandName": "Toyota",
    "name": "Camry",
    "generation": "XV70",
    "productionStartYear": 2017,
    "averagePriceRub": 2500000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "fwd",
        "engineVolumeL": 2.5,
        "horsepower": 181,
        "fuelConsumption": 7.8,
        "insuranceCostPerYearRub": 45000,
        "annualTaxCostRub": 22500,
        "maintenanceCostPerYearRub": 35000
      }
    ]
  },
  {
    "brandName": "Toyota",
    "name": "RAV4",
    "generation": "XA50",
    "productionStartYear": 2018,
    "averagePriceRub": 3200000,
    "specifications": [
      {
        "bodyType": "suv",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "awd",
        "engineVolumeL": 2.0,
        "horsepower": 149,
        "fuelConsumption": 8.1,
        "insuranceCostPerYearRub": 55000,
        "annualTaxCostRub": 18600,
        "maintenanceCostPerYearRub": 42000
      }
    ]
  },
  {
    "brandName": "BMW",
    "name": "3 Series",
    "generation": "G20",
    "productionStartYear": 2019,
    "averagePriceRub": 3800000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "rwd",
        "engineVolumeL": 2.0,
        "horsepower": 184,
        "fuelConsumption": 7.1,
        "insuranceCostPerYearRub": 65000,
        "annualTaxCostRub": 22920,
        "maintenanceCostPerYearRub": 80000
      }
    ]
  },
  {
    "brandName": "Volkswagen",
    "name": "Polo",
    "generation": "VI",
    "productionStartYear": 2020,
    "averagePriceRub": 1400000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "fwd",
        "engineVolumeL": 1.6,
        "horsepower": 110,
        "fuelConsumption": 6.5,
        "insuranceCostPerYearRub": 32000,
        "annualTaxCostRub": 13700,
        "maintenanceCostPerYearRub": 28000
      }
    ]
  },
  {
    "brandName": "Hyundai",
    "name": "Creta",
    "generation": "II",
    "productionStartYear": 2020,
    "averagePriceRub": 2100000,
    "specifications": [
      {
        "bodyType": "crossover",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "fwd",
        "engineVolumeL": 1.6,
        "horsepower": 123,
        "fuelConsumption": 7.4,
        "insuranceCostPerYearRub": 40000,
        "annualTaxCostRub": 15330,
        "maintenanceCostPerYearRub": 32000
      }
    ]
  },
  {
    "brandName": "Kia",
    "name": "Rio",
    "generation": "IV",
    "productionStartYear": 2017,
    "averagePriceRub": 1300000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "fwd",
        "engineVolumeL": 1.6,
        "horsepower": 123,
        "fuelConsumption": 6.8,
        "insuranceCostPerYearRub": 30000,
        "annualTaxCostRub": 15330,
        "maintenanceCostPerYearRub": 26000
      }
    ]
  },
  {
    "brandName": "Lada",
    "name": "Vesta",
    "generation": "I",
    "productionStartYear": 2015,
    "averagePriceRub": 1100000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "manual",
        "driveType": "fwd",
        "engineVolumeL": 1.6,
        "horsepower": 106,
        "fuelConsumption": 7.2,
        "insuranceCostPerYearRub": 25000,
        "annualTaxCostRub": 13200,
        "maintenanceCostPerYearRub": 20000
      }
    ]
  },
  {
    "brandName": "Skoda",
    "name": "Octavia",
    "generation": "IV",
    "productionStartYear": 2020,
    "averagePriceRub": 2300000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "fwd",
        "engineVolumeL": 1.4,
        "horsepower": 150,
        "fuelConsumption": 6.4,
        "insuranceCostPerYearRub": 42000,
        "annualTaxCostRub": 18690,
        "maintenanceCostPerYearRub": 38000
      }
    ]
  },
  {
    "brandName": "Mazda",
    "name": "CX-5",
    "generation": "II",
    "productionStartYear": 2017,
    "averagePriceRub": 2800000,
    "specifications": [
      {
        "bodyType": "suv",
        "fuelType": "petrol",
        "transmission": "automatic",
        "driveType": "awd",
        "engineVolumeL": 2.0,
        "horsepower": 150,
        "fuelConsumption": 7.9,
        "insuranceCostPerYearRub": 50000,
        "annualTaxCostRub": 18690,
        "maintenanceCostPerYearRub": 40000
      }
    ]
  },
  {
    "brandName": "Honda",
    "name": "Civic",
    "generation": "XI",
    "productionStartYear": 2021,
    "averagePriceRub": 2400000,
    "specifications": [
      {
        "bodyType": "sedan",
        "fuelType": "petrol",
        "transmission": "cvt",
        "driveType": "fwd",
        "engineVolumeL": 1.5,
        "horsepower": 182,
        "fuelConsumption": 6.7,
        "insuranceCostPerYearRub": 44000,
        "annualTaxCostRub": 22680,
        "maintenanceCostPerYearRub": 36000
      }
    ]
  }
]
```

### 10. Search Service Seed Script (seeds/search/seed.ts):

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_SEARCH,
    },
  },
});

async function main() {
  console.log('🌱 Seeding search database...');

  // Читаем данные
  const dataPath = path.join(__dirname, 'data');

  const countries = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'countries.json'), 'utf-8')
  );
  const cities = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'cities.json'), 'utf-8')
  );
  const brandsData = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'brands.json'), 'utf-8')
  );
  const bodyTypes = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'body-types.json'), 'utf-8')
  );
  const fuelTypes = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'fuel-types.json'), 'utf-8')
  );
  const transmissions = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'transmissions.json'), 'utf-8')
  );
  const driveTypes = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'drive-types.json'), 'utf-8')
  );
  const modelsData = JSON.parse(
    fs.readFileSync(path.join(dataPath, 'models.json'), 'utf-8')
  );

  // Очищаем в правильном порядке
  console.log('🗑️  Clearing existing data...');
  await prisma.modelSpecification.deleteMany();
  await prisma.model.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  await prisma.bodyType.deleteMany();
  await prisma.fuelType.deleteMany();
  await prisma.transmission.deleteMany();
  await prisma.driveType.deleteMany();
  await prisma.comparisonCriteria.deleteMany();

  // 1. Страны
  console.log('🌍 Creating countries...');
  const countryMap = new Map();
  for (const country of countries) {
    const created = await prisma.country.create({
      data: country,
    });
    countryMap.set(country.isoCode, created.id);
  }

  // 2. Города
  console.log('🏙️  Creating cities...');
  for (const city of cities) {
    await prisma.city.create({
      data: {
        name: city.name,
        countryId: countryMap.get(city.countryIsoCode),
      },
    });
  }

  // 3. Бренды
  console.log('🚗 Creating brands...');
  const brandMap = new Map();
  for (const brand of brandsData) {
    const created = await prisma.brand.create({
      data: {
        name: brand.name,
        countryId: countryMap.get(brand.countryIsoCode),
      },
    });
    brandMap.set(brand.name, created.id);
  }

  // 4. Справочники характеристик
  console.log('📋 Creating reference tables...');

  const bodyTypeMap = new Map();
  for (const bt of bodyTypes) {
    const created = await prisma.bodyType.create({ data: bt });
    bodyTypeMap.set(bt.code, created.id);
  }

  const fuelTypeMap = new Map();
  for (const ft of fuelTypes) {
    const created = await prisma.fuelType.create({ data: ft });
    fuelTypeMap.set(ft.code, created.id);
  }

  const transmissionMap = new Map();
  for (const t of transmissions) {
    const created = await prisma.transmission.create({ data: t });
    transmissionMap.set(t.code, created.id);
  }

  const driveTypeMap = new Map();
  for (const dt of driveTypes) {
    const created = await prisma.driveType.create({ data: dt });
    driveTypeMap.set(dt.code, created.id);
  }

  // 5. Модели и характеристики
  console.log('🚙 Creating models and specifications...');
  let specsCount = 0;

  for (const modelData of modelsData) {
    const model = await prisma.model.create({
      data: {
        name: modelData.name,
        generation: modelData.generation,
        productionStartYear: modelData.productionStartYear,
        productionEndYear: modelData.productionEndYear,
        averagePriceRub: modelData.averagePriceRub,
        brandId: brandMap.get(modelData.brandName),
      },
    });

    for (const spec of modelData.specifications) {
      await prisma.modelSpecification.create({
        data: {
          modelId: model.id,
          bodyTypeId: bodyTypeMap.get(spec.bodyType),
          fuelTypeId: fuelTypeMap.get(spec.fuelType),
          transmissionId: transmissionMap.get(spec.transmission),
          driveTypeId: driveTypeMap.get(spec.driveType),
          engineVolumeL: spec.engineVolumeL,
          horsepower: spec.horsepower,
          fuelConsumptionCombined: spec.fuelConsumption,
          insuranceCostPerYearRub: spec.insuranceCostPerYearRub,
          annualTaxCostRub: spec.annualTaxCostRub,
          maintenanceCostPerYearRub: spec.maintenanceCostPerYearRub,
          isActive: true,
        },
      });
      specsCount++;
    }
  }

  // 6. Критерии сравнения
  console.log('📊 Creating comparison criteria...');
  const criteria = [
    {
      code: 'price',
      name: 'Цена',
      description: 'Средняя рыночная цена',
      units: 'руб.',
      priority: 1,
    },
    {
      code: 'fuel_consumption',
      name: 'Расход топлива',
      description: 'Средний расход в смешанном цикле',
      units: 'л/100км',
      priority: 2,
    },
    {
      code: 'annual_cost',
      name: 'Стоимость владения в год',
      description: 'Страховка + налог + обслуживание',
      units: 'руб./год',
      priority: 3,
    },
    {
      code: 'horsepower',
      name: 'Мощность',
      description: 'Мощность двигателя',
      units: 'л.с.',
      priority: 4,
    },
    {
      code: 'engine_volume',
      name: 'Объем двигателя',
      description: 'Рабочий объем двигателя',
      units: 'л',
      priority: 5,
    },
  ];

  for (const criterion of criteria) {
    await prisma.comparisonCriteria.create({ data: criterion });
  }

  console.log('✅ Search database seeded successfully!');
  console.log(`   Countries: ${countries.length}`);
  console.log(`   Cities: ${cities.length}`);
  console.log(`   Brands: ${brandsData.length}`);
  console.log(`   Models: ${modelsData.length}`);
  console.log(`   Specifications: ${specsCount}`);
  console.log(`   Criteria: ${criteria.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 11. Chat Service Seed (seeds/chat/seed.ts):

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_CHAT,
    },
  },
});

async function main() {
  console.log('🌱 Seeding chat database...');

  // Очищаем данные
  await prisma.searchResult.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();

  console.log('✅ Chat database ready (empty for production start)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## DOCKER CONFIGURATION

### Docker Compose (docker-compose.yml):

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: cars_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: postgres -c config_file=/etc/postgresql/postgresql.conf

  redis:
    image: redis:7-alpine
    container_name: cars_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./docker/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # PgAdmin (опционально для dev)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: cars_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@cars.ru
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

  # Redis Commander (опционально для dev)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: cars_redis_commander
    restart: unless-stopped
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local
```

### PostgreSQL Config (docker/postgres/postgresql.conf):

```conf
# Connection Settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_statement = 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Character Set
client_encoding = 'UTF8'
lc_messages = 'en_US.UTF-8'
lc_monetary = 'en_US.UTF-8'
lc_numeric = 'en_US.UTF-8'
lc_time = 'en_US.UTF-8'
default_text_search_config = 'pg_catalog.russian'
```

### Redis Config (docker/redis/redis.conf):

```conf
# Network
bind 0.0.0.0
port 6379
timeout 300

# Persistence
save 900 1
save 300 10
save 60 10000

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Logging
loglevel notice
logfile ""

# Performance
tcp-backlog 511
databases 16
```

---

## SCRIPTS

### Init Databases (scripts/init-databases.sql):

```sql
-- Создаём отдельные базы данных для каждого сервиса
CREATE DATABASE users_db;
CREATE DATABASE search_db;
CREATE DATABASE chat_db;

-- Подключаемся к каждой БД и настраиваем
\c users_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON DATABASE users_db IS 'User Service - аутентификация и профили';

\c search_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON DATABASE search_db IS 'Search Service - каталог автомобилей';

\c chat_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON DATABASE chat_db IS 'Chat Service - диалоги и результаты поиска';

-- Возвращаемся к postgres БД
\c postgres;
```

### Backup Script (scripts/backup.sh):

```bash
#!/bin/bash

# Backup всех баз данных
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

echo "📦 Creating backup..."

# Backup каждой БД
docker exec cars_postgres pg_dump -U postgres users_db > "$BACKUP_DIR/users_db.sql"
docker exec cars_postgres pg_dump -U postgres search_db > "$BACKUP_DIR/search_db.sql"
docker exec cars_postgres pg_dump -U postgres chat_db > "$BACKUP_DIR/chat_db.sql"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" -C ./backups $DATE
rm -rf $BACKUP_DIR

echo "✅ Backup created: $BACKUP_DIR.tar.gz"
```

### Restore Script (scripts/restore.sh):

```bash
#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE=$1
TEMP_DIR="./backups/temp"

echo "📥 Restoring from $BACKUP_FILE..."

# Extract
mkdir -p $TEMP_DIR
tar -xzf $BACKUP_FILE -C $TEMP_DIR

# Restore each DB
BACKUP_DATE=$(basename $BACKUP_FILE .tar.gz)

docker exec -i cars_postgres psql -U postgres users_db < "$TEMP_DIR/$BACKUP_DATE/users_db.sql"
docker exec -i cars_postgres psql -U postgres search_db < "$TEMP_DIR/$BACKUP_DATE/search_db.sql"
docker exec -i cars_postgres psql -U postgres chat_db < "$TEMP_DIR/$BACKUP_DATE/chat_db.sql"

# Cleanup
rm -rf $TEMP_DIR

echo "✅ Restore completed"
```

### Reset All Script (scripts/reset-all.sh):

```bash
#!/bin/bash

echo "⚠️  This will DELETE ALL DATA. Are you sure? (yes/no)"
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled"
  exit 0
fi

echo "🗑️  Dropping all databases..."

docker exec cars_postgres psql -U postgres -c "DROP DATABASE IF EXISTS users_db;"
docker exec cars_postgres psql -U postgres -c "DROP DATABASE IF EXISTS search_db;"
docker exec cars_postgres psql -U postgres -c "DROP DATABASE IF EXISTS chat_db;"

echo "🔧 Re-creating databases..."
docker exec cars_postgres psql -U postgres -f /docker-entrypoint-initdb.d/01-init.sql

echo "✅ All databases reset. Run migrations and seeds to populate."
```

---

## ENVIRONMENT VARIABLES (.env.example):

```env
# PostgreSQL
DATABASE_URL_USERS=postgresql://postgres:postgres@localhost:5432/users_db
DATABASE_URL_SEARCH=postgresql://postgres:postgres@localhost:5432/search_db
DATABASE_URL_CHAT=postgresql://postgres:postgres@localhost:5432/chat_db

# Redis
REDIS_URL=redis://localhost:6379

# PgAdmin
PGADMIN_EMAIL=admin@cars.ru
PGADMIN_PASSWORD=admin
```

---

## SETUP INSTRUCTIONS

### 1. Запуск инфраструктуры:

```bash
cd database
docker-compose up -d
```

### 2. Проверка состояния:

```bash
docker-compose ps

# Должно быть:
# cars_postgres    ... Up (healthy)
# cars_redis       ... Up (healthy)
```

### 3. Применение миграций (из каждого сервиса):

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

### 4. Seed данных:

```bash
# Users
cd database/seeds/users
npm run seed

# Search (ВАЖНО: делать после users!)
cd ../search
npm run seed

# Chat
cd ../chat
npm run seed
```

### 5. Проверка данных через PgAdmin:

- Откройте http://localhost:5050
- Логин: admin@cars.ru / admin
- Добавьте сервер: postgres:5432
- Проверьте наличие данных в users_db, search_db, chat_db

### 6. Проверка Redis через Redis Commander:

- Откройте http://localhost:8081
- Проверьте подключение к Redis

---

## КРИТИЧЕСКИ ВАЖНО:

1. **Синхронизация схем** - Prisma схемы в database/schemas ДОЛЖНЫ быть идентичны backend/services/*/prisma/schema.prisma
2. **Порядок seed** - Сначала справочники (countries, brands), потом модели, потом specifications
3. **UUID extension** - Обязательно включена для всех БД
4. **Индексы** - Добавлены для всех часто используемых полей (modelId, bodyTypeId, userId, etc.)
5. **Cascading deletes** - Настроены правильно (onDelete: Cascade) для связанных записей
6. **Decimal precision** - Для цен используется Decimal(12, 2), для расхода Decimal(4, 1)
7. **Timestamps** - createdAt, updatedAt везде где нужно
8. **Enums** - Используются для статусов и ролей (type-safe)
9. **Backup** - Регулярное резервное копирование обязательно
10. **Health checks** - Docker контейнеры должны проходить health checks перед стартом сервисов
11. **npm install** - Всегда использовать `npm install` вместо `npm ci`, так как package-lock.json может отсутствовать
12. **.dockerignore** - ОБЯЗАТЕЛЬНО создавать для исключения node_modules, dist и других ненужных файлов из Docker build context

## PACKAGE.JSON для seeds:

```json
{
  "name": "@cars/database-seeds",
  "version": "1.0.0",
  "scripts": {
    "seed:users": "tsx seeds/users/seed.ts",
    "seed:search": "tsx seeds/search/seed.ts",
    "seed:chat": "tsx seeds/chat/seed.ts",
    "seed:all": "npm run seed:users && npm run seed:search && npm run seed:chat"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/bcrypt": "^5.0.2",
    "prisma": "^5.20.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```
