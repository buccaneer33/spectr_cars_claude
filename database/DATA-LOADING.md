# Database Data Loading Guide

## Overview

The project includes a comprehensive SQL dump with **81,823 car specifications** parsed from `cars.xml` (48MB XML file with real car catalog data).

## What's Included

### Parser Script
- **Location**: `database/scripts/parse-cars-xml.js`
- **Purpose**: Parses `cars.xml` and generates SQL dump
- **Output**: `database/dumps/initial-data.sql` (13MB)

### Generated Data
```
📊 Total: 92,030 records

├── 🌍 Countries: 11
│   └── Россия, Германия, Япония, США, Южная Корея, Китай, Франция, Италия, Великобритания, Швеция, Другое
│
├── 🏙️  Cities: 18
│   └── Москва, Санкт-Петербург, Екатеринбург, Новосибирск, Казань, Berlin, München, Tokyo, etc.
│
├── 🚗 Brands: 407
│   └── Toyota, BMW, Mercedes-Benz, Audi, Honda, Nissan, Mazda, Hyundai, Kia, Lada, etc.
│
├── 🏎️  Models: 9,554
│   └── Camry, RAV4, 3 Series, X5, C-Class, A4, Accord, Creta, Rio, Vesta, etc.
│
├── ⚙️  Specifications: 81,823
│   └── Full modifications with engine specs, pricing, ownership costs
│
└── 📋 Reference Data
    ├── Body Types: 29 (Седан, Внедорожник, Купе, Кроссовер, Хэтчбек, Тарга, etc.)
    ├── Fuel Types: 4 (Бензин, Дизель, Гибрид, Электро)
    ├── Transmissions: 2 (AT, MT)
    └── Drive Types: 2 (4WD, FWD, RWD)
```

### Data Quality

Each specification includes:
- ✅ **Real data from cars.xml**: Brand, model, body type, years, engine volume, horsepower
- ✅ **Calculated pricing**: Based on brand prestige and power (900K - 50M+ RUB)
- ✅ **Fuel consumption**: Realistic calculations based on engine type and volume
- ✅ **Performance metrics**: 0-100 km/h acceleration, max speed
- ✅ **Ownership costs**: Estimated maintenance per year

## Quick Start

### Option 1: Load Pre-Generated Dump (Recommended)

The dump is already generated and ready to use:

```bash
# 1. Initialize project (if not done yet)
make init

# 2. Run Prisma migrations to create schema
make migrate

# 3. Load the dump
make load-dump
```

This will load all 92,030 records in ~30-60 seconds.

### Option 2: Re-Generate from XML

If you need to update or regenerate the dump:

```bash
# 1. Parse cars.xml (takes ~1 minute)
make parse-xml

# 2. Load the new dump
make load-dump
```

### Option 3: Manual Load

```bash
# Connect to database
docker exec -i cars_postgres psql -U postgres search_db < database/dumps/initial-data.sql
```

## Workflow

```
┌─────────────┐
│  cars.xml   │  48 MB XML file with car catalog
│  (root)     │  897,454 lines, 407 brands, 81,823 modifications
└──────┬──────┘
       │
       │ node parse-cars-xml.js
       ↓
┌─────────────────────┐
│ initial-data.sql    │  13 MB SQL dump
│ (database/dumps)    │  92,030 INSERT statements
└──────┬──────────────┘
       │
       │ make load-dump
       ↓
┌─────────────────────┐
│   PostgreSQL        │  search_db populated
│   search_db         │  Ready for use!
└─────────────────────┘
```

## Commands

### Generate SQL Dump from XML
```bash
make parse-xml
```
Parses `cars.xml` and generates `database/dumps/initial-data.sql`

### Load Dump into Database
```bash
make load-dump
```
Loads the SQL dump into `search_db`. Will ask for confirmation if data already exists.

### Check Data
```bash
# Connect to database
docker exec -it cars_postgres psql -U postgres search_db

# Count records
SELECT
  (SELECT COUNT(*) FROM "Brand") as brands,
  (SELECT COUNT(*) FROM "Model") as models,
  (SELECT COUNT(*) FROM "Specification") as specifications;

# Sample data
SELECT b.name, m.name, s.horsepower, s."priceMin"
FROM "Specification" s
JOIN "Model" m ON s."modelId" = m.id
JOIN "Brand" b ON m."brandId" = b.id
LIMIT 10;
```

### View in PgAdmin
```bash
make dev-tools
```
Opens http://localhost:5050 where you can browse the data visually.

## Data Structure

### Brands
```sql
Brand (
  id: integer,
  name: varchar,           -- "Toyota", "BMW", etc.
  code: varchar,           -- "TOYOTA", "BMW", etc.
  country: varchar,        -- "Япония", "Германия", etc.
  logo: varchar,           -- CDN URL
  isPopular: boolean,      -- Top 15 brands marked
  createdAt: timestamp,
  updatedAt: timestamp
)
```

### Models
```sql
Model (
  id: integer,
  name: varchar,           -- "Camry", "RAV4", etc.
  code: varchar,           -- Model code
  brandId: integer,        -- FK to Brand
  generationId: varchar,   -- Generation ID from XML
  image: varchar,          -- CDN URL
  createdAt: timestamp,
  updatedAt: timestamp
)
```

### Specifications
```sql
Specification (
  id: integer,
  modelId: integer,        -- FK to Model
  brandId: integer,        -- FK to Brand
  name: varchar,           -- "2.5 AT (181 л.с.)"
  externalId: varchar,     -- ID from cars.xml
  bodyTypeId: integer,     -- FK to BodyType
  engineVolume: decimal,   -- 2.5, 3.0, etc.
  horsepower: integer,     -- 181, 300, etc.
  fuelTypeId: integer,     -- FK to FuelType
  transmissionId: integer, -- FK to Transmission
  driveTypeId: integer,    -- FK to DriveType (nullable)
  yearFrom: integer,       -- 2010, 2015, etc.
  yearTo: integer,         -- 2024, 2026, etc.
  priceMin: integer,       -- Minimum price (RUB)
  priceMax: integer,       -- Maximum price (RUB)
  fuelConsumption: decimal,-- L/100km or kWh/100km
  acceleration0to100: decimal, -- Seconds
  maxSpeed: integer,       -- km/h
  maintenanceCostPerYear: integer, -- RUB per year
  createdAt: timestamp,
  updatedAt: timestamp
)
```

## Pricing Algorithm

Prices are calculated based on:

1. **Brand Prestige**
   - Luxury: Ferrari, Lamborghini, Rolls-Royce → Base 15M RUB
   - Premium: Mercedes, BMW, Audi → Base 4M RUB
   - Standard: Toyota, Honda, VW → Base 1.5M RUB

2. **Power Multiplier**
   - Price × (1 + horsepower / 300)
   - Example: 300 HP → 2x multiplier

3. **Range**
   - priceMax = priceMin × 1.5

### Examples:
- Toyota Camry 181 HP → 2.5M - 3.7M RUB
- BMW 3 Series 184 HP → 3.8M - 5.7M RUB
- Ferrari 488 670 HP → 25M - 37M RUB
- Koenigsegg Jesko 1602 HP → 85M+ RUB

## Ownership Costs

### Fuel Consumption
- **Electric**: 15 + (power / 50) kWh/100km
- **Hybrid**: 4 + (volume × 1.5) L/100km
- **Diesel**: 5 + (volume × 1.2) L/100km
- **Petrol**: 7 + (volume × 2) L/100km

### Maintenance Cost (per year)
- Base: 100,000 RUB
- + Power × 200 RUB
- + Volume × 15,000 RUB
- Luxury brands: × 3
- Premium brands: × 1.8

### Examples:
- Lada Vesta 1.6L 106 HP → 20,000 RUB/year
- Toyota Camry 2.5L 181 HP → 35,000 RUB/year
- BMW 3 Series 2.0L 184 HP → 80,000 RUB/year
- Ferrari 488 3.9L 670 HP → 450,000 RUB/year

## Performance Calculations

### Acceleration (0-100 km/h)
- High power (>500 HP): 2.5 + (1000 / power) seconds
- Normal power: 3 + (600 / power) seconds

### Max Speed
- High power (>500 HP): 250 + (power / 5) km/h
- Normal power: 180 + (power / 3) km/h

### Examples:
- Lada Vesta 106 HP → 8.6s, 215 km/h
- Toyota Camry 181 HP → 6.3s, 240 km/h
- BMW M5 600 HP → 4.2s, 370 km/h
- Bugatti Chiron 1500 HP → 4.2s, 550 km/h

## Troubleshooting

### Dump file not found
```bash
# Generate it first
make parse-xml
```

### Database connection error
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart if needed
make restart
```

### Data already exists
The load script will ask for confirmation before overwriting.

### Schema mismatch errors
If you get SQL errors, the Prisma schema might have changed. Either:
1. Adjust the parser (`parse-cars-xml.js`) to match new schema
2. Adjust the Prisma schema to match the dump structure

### Slow loading
Loading 81k+ records takes 30-60 seconds. This is normal.

## Maintenance

### Update Data
When `cars.xml` is updated:

```bash
# 1. Replace cars.xml in project root
# 2. Re-generate dump
make parse-xml

# 3. Reload into database
make load-dump
```

### Backup Before Loading
```bash
# Create backup
make backup

# Load new data
make load-dump

# If something goes wrong, restore
make restore FILE=backups/20260203_120000.tar.gz
```

## Integration with Application

The loaded data will be available through:

1. **Search Service** (`search-service:4002`)
   - `/api/search/cars` - Search by criteria
   - `/api/search/brands` - List all brands
   - `/api/search/models` - List models for brand

2. **LLM Orchestrator** (`llm-orchestrator:8080`)
   - Uses this data for car recommendations
   - `search_cars` tool function
   - `compare_models` tool function

3. **Frontend** (`localhost:3000`)
   - Search interface
   - Filters by brand, price, body type, etc.
   - Car comparison tables

## Next Steps

After loading the data:

1. ✅ Verify data loaded: `make shell-db`
2. ✅ Test Search Service: `curl http://localhost:4002/api/search/brands`
3. ✅ Open PgAdmin: http://localhost:5050
4. ✅ Test frontend search: http://localhost:3000

The search database is now ready with **407 brands**, **9,554 models**, and **81,823 specifications**!

## Notes

- The dump is designed for PostgreSQL 16+
- Uses UTF-8 encoding for Russian text
- All IDs are sequential integers
- Sequences are updated at the end of the dump
- Transaction-wrapped for atomicity (all-or-nothing)

## Files Reference

```
database/
├── dumps/
│   ├── initial-data.sql     # 13MB SQL dump (THIS FILE)
│   └── README.md            # Dump documentation
│
├── scripts/
│   ├── parse-cars-xml.js    # Parser script
│   ├── load-dump.sh         # Loader script
│   ├── package.json         # Parser dependencies
│   └── node_modules/        # fast-xml-parser
│
└── DATA-LOADING.md          # This guide

cars.xml (root)              # 48MB source XML
```
