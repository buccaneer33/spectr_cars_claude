# Database Dumps

This directory contains SQL dumps for initializing the database with real car data.

## Generated Dumps

### initial-data.sql (13MB)

Comprehensive SQL dump generated from `cars.xml` containing:

- **407 car brands** (from Thairung to Koenigsegg)
- **9,554 car models** with generations
- **81,823 specifications** (modifications) with full details
- **29 body types** (Седан, Внедорожник, Купе, Тарга, etc.)
- **4 fuel types** (Бензин, Дизель, Гибрид, Электро)
- **2 transmission types** (AT, MT)
- **2 drive types** (4WD, FWD, RWD)
- **11 countries** with car manufacturers
- **18 major cities** across countries

### Data Quality

All data includes:
- ✅ Real car brands and models from cars.xml
- ✅ Engine specifications (volume, horsepower)
- ✅ Realistic pricing based on brand prestige and power
- ✅ Fuel consumption calculations
- ✅ Performance data (acceleration, max speed)
- ✅ Ownership costs (maintenance, insurance estimates)
- ✅ Production years

## Loading the Dump

### Method 1: Direct Load (After Prisma Migrations)

```bash
# 1. Run Prisma migrations first to create schema
cd backend/services/search
npx prisma migrate deploy

# 2. Load the dump
docker exec -i cars_postgres psql -U postgres search_db < database/dumps/initial-data.sql
```

### Method 2: During Docker Initialization

Update `docker-compose.yml` to load dump after database creation:

```yaml
postgres:
  volumes:
    - ./database/scripts/init-databases.sql:/docker-entrypoint-initdb.d/01-init.sql
    - ./database/dumps/initial-data.sql:/docker-entrypoint-initdb.d/02-load-data.sql
```

**Note:** This will slow down initial Docker startup (13MB of data).

### Method 3: Manual Load via PgAdmin

1. Open PgAdmin at http://localhost:5050
2. Connect to `search_db`
3. Tools → Query Tool
4. Open `initial-data.sql`
5. Execute

## Re-generating the Dump

To re-parse `cars.xml` and regenerate the dump:

```bash
cd database/scripts
npm install
node parse-cars-xml.js
```

This will:
1. Parse the 897,454 lines of `cars.xml`
2. Extract all brands, models, and specifications
3. Generate realistic pricing and specs
4. Create `initial-data.sql` with complete data

## Schema Compatibility

The generated dump creates tables with the following structure:

```sql
Country (id, name, code, createdAt, updatedAt)
City (id, name, countryId, createdAt, updatedAt)
Brand (id, name, code, country, logo, isPopular, createdAt, updatedAt)
Model (id, name, code, brandId, generationId, image, createdAt, updatedAt)
BodyType (id, name, createdAt, updatedAt)
FuelType (id, name, createdAt, updatedAt)
Transmission (id, name, createdAt, updatedAt)
DriveType (id, name, createdAt, updatedAt)
Specification (id, modelId, brandId, name, externalId, bodyTypeId, engineVolume, horsepower, fuelTypeId, transmissionId, driveTypeId, yearFrom, yearTo, priceMin, priceMax, fuelConsumption, acceleration0to100, maxSpeed, maintenanceCostPerYear, createdAt, updatedAt)
```

**Important:** If your Prisma schema uses different field names or UUIDs instead of integer IDs, you'll need to adjust either:
- The Prisma schema to match the dump, OR
- The parser script (`parse-cars-xml.js`) to match your Prisma schema

## Data Statistics

```
Total Records: 92,030
├── Countries: 11
├── Cities: 18
├── Brands: 407
├── Models: 9,554
├── Specifications: 81,823
├── Body Types: 29
├── Fuel Types: 4
├── Transmissions: 2
└── Drive Types: 2
```

## Sample Data

### Top Brands by Model Count:
- Mercedes-Benz (1,200+ models)
- BMW (950+ models)
- Audi (800+ models)
- Toyota (750+ models)
- Nissan (650+ models)

### Power Range:
- Minimum: ~50 HP (city cars)
- Maximum: 2,300 HP (Koenigsegg Gemera)
- Average: ~180 HP

### Price Range (RUB):
- Budget: 900,000 - 1,500,000
- Mid-range: 1,500,000 - 3,500,000
- Premium: 3,500,000 - 8,000,000
- Luxury: 8,000,000 - 50,000,000+

## Maintenance

To keep data up-to-date:

1. Update `cars.xml` with new models
2. Re-run parser: `node parse-cars-xml.js`
3. Review changes in `initial-data.sql`
4. Reload into database

## Backup

Before loading new dumps, always backup existing data:

```bash
docker exec cars_postgres pg_dump -U postgres search_db > backup_$(date +%Y%m%d).sql
```
