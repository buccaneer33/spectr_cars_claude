#!/usr/bin/env node
/**
 * Parse cars.xml and generate SQL dump for database initialization
 */

const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

class CarsXMLParser {
    constructor(xmlFile) {
        this.xmlFile = xmlFile;
        this.brands = [];
        this.models = [];
        this.modifications = [];
        this.bodyTypes = new Set();
        this.fuelTypes = new Set();
        this.transmissions = new Set();
        this.driveTypes = new Set();
    }

    async parse() {
        console.log('🔄 Parsing cars.xml...');

        const xmlData = fs.readFileSync(this.xmlFile, 'utf-8');

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
            textNodeName: '_text'
        });

        const data = parser.parse(xmlData);
        const marks = Array.isArray(data.catalog.mark) ? data.catalog.mark : [data.catalog.mark];

        let brandIdCounter = 1;
        let modelIdCounter = 1;
        let modificationIdCounter = 1;

        for (const mark of marks) {
            const brandName = mark.name;
            const brandCode = mark.code || brandName.toUpperCase();

            // Add brand
            const brandData = {
                id: brandIdCounter,
                name: brandName,
                code: brandCode,
                country: this.guessCountry(brandName)
            };
            this.brands.push(brandData);

            // Parse models (folders)
            const folders = Array.isArray(mark.folder) ? mark.folder : (mark.folder ? [mark.folder] : []);

            for (const folder of folders) {
                const modelName = folder.name;
                const generationId = folder.id || `gen_${modelIdCounter}`;
                const modelCode = folder.model?._text || folder.model || modelName;

                const modelData = {
                    id: modelIdCounter,
                    brand_id: brandIdCounter,
                    name: modelName,
                    code: String(modelCode),
                    generation_id: String(generationId)
                };
                this.models.push(modelData);

                // Parse modifications
                const modifications = Array.isArray(folder.modification)
                    ? folder.modification
                    : (folder.modification ? [folder.modification] : []);

                for (const modification of modifications) {
                    const modName = modification.name;
                    const modId = modification.id || `mod_${modificationIdCounter}`;

                    const bodyType = modification.body_type || 'Седан';
                    const years = modification.years || '2020 - 2024';

                    this.bodyTypes.add(bodyType);

                    // Extract technical specs from modification name
                    const engineInfo = this.parseModificationName(modName);

                    this.fuelTypes.add(engineInfo.fuelType);
                    this.transmissions.add(engineInfo.transmission);
                    if (engineInfo.driveType) {
                        this.driveTypes.add(engineInfo.driveType);
                    }

                    // Parse years
                    const [yearFrom, yearTo] = this.parseYears(years);

                    // Generate realistic prices and specs
                    const specs = this.generateSpecs(brandName, engineInfo, bodyType, yearFrom);

                    const modificationData = {
                        id: modificationIdCounter,
                        model_id: modelIdCounter,
                        brand_id: brandIdCounter,
                        name: modName,
                        external_id: String(modId),
                        body_type: bodyType,
                        engine_volume: engineInfo.volume,
                        horsepower: engineInfo.power,
                        fuel_type: engineInfo.fuelType,
                        transmission: engineInfo.transmission,
                        drive_type: engineInfo.driveType,
                        year_from: yearFrom,
                        year_to: yearTo,
                        price_min: specs.priceMin,
                        price_max: specs.priceMax,
                        fuel_consumption: specs.fuelConsumption,
                        acceleration_0_100: specs.acceleration,
                        max_speed: specs.maxSpeed,
                        maintenance_cost_per_year: specs.maintenanceCost
                    };
                    this.modifications.push(modificationData);
                    modificationIdCounter++;
                }

                modelIdCounter++;
            }

            brandIdCounter++;
        }

        console.log(`✅ Parsed: ${this.brands.length} brands, ${this.models.length} models, ${this.modifications.length} modifications`);
    }

    parseModificationName(modName) {
        const result = {
            volume: 2.0,
            power: 150,
            fuelType: 'Бензин',
            transmission: 'MT',
            driveType: null
        };

        // Engine volume (e.g., "2.8", "3.5", "5.0")
        const volumeMatch = modName.match(/(\d+\.\d+)/);
        if (volumeMatch) {
            result.volume = parseFloat(volumeMatch[1]);
        }

        // Horsepower (e.g., "177 л.с.", "888 л.с.")
        const powerMatch = modName.match(/(\d+)\s*л\.с\./);
        if (powerMatch) {
            result.power = parseInt(powerMatch[1]);
        }

        // Fuel type
        if (/\d+\.\d+d/i.test(modName)) {
            result.fuelType = 'Дизель';
        } else if (/hyb/i.test(modName)) {
            result.fuelType = 'Гибрид';
        } else if (/electric|ev/i.test(modName)) {
            result.fuelType = 'Электро';
        } else {
            result.fuelType = 'Бензин';
        }

        // Transmission
        if (/AT|AMT|CVT/i.test(modName)) {
            result.transmission = 'AT';
        } else if (/MT/i.test(modName)) {
            result.transmission = 'MT';
        } else {
            result.transmission = 'AT';
        }

        // Drive type
        if (/4WD|4X4/i.test(modName)) {
            result.driveType = '4WD';
        } else if (/FWD/i.test(modName)) {
            result.driveType = 'FWD';
        } else if (/RWD|RR/i.test(modName)) {
            result.driveType = 'RWD';
        }

        return result;
    }

    parseYears(yearsStr) {
        const currentYear = new Date().getFullYear();
        let yearFrom = currentYear - 4;
        let yearTo = currentYear;

        if (!yearsStr) {
            return [yearFrom, yearTo];
        }

        // Extract start year
        const startMatch = yearsStr.match(/(\d{4})/);
        if (startMatch) {
            yearFrom = parseInt(startMatch[1]);
        }

        // Extract end year
        if (/по н\.в\.|н\.в\./.test(yearsStr)) {
            yearTo = currentYear;
        } else {
            const years = yearsStr.match(/(\d{4})/g);
            if (years && years.length >= 2) {
                yearTo = parseInt(years[1]);
            }
        }

        return [yearFrom, yearTo];
    }

    guessCountry(brandName) {
        const russianBrands = ['Lada', 'ГАЗ', 'УАЗ', 'Москвич', 'Marussia'];
        if (russianBrands.includes(brandName)) return 'Россия';

        const germanBrands = ['Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen', 'Porsche', 'Opel'];
        if (germanBrands.includes(brandName)) return 'Германия';

        const japaneseBrands = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Lexus', 'Suzuki', 'Isuzu'];
        if (japaneseBrands.includes(brandName)) return 'Япония';

        const americanBrands = ['Ford', 'Chevrolet', 'Dodge', 'Jeep', 'Tesla', 'Cadillac', 'Chrysler'];
        if (americanBrands.includes(brandName)) return 'США';

        const koreanBrands = ['Hyundai', 'Kia', 'Genesis', 'Daewoo'];
        if (koreanBrands.includes(brandName)) return 'Южная Корея';

        const chineseBrands = ['Chery', 'Geely', 'BYD', 'Great Wall', 'Haval', 'Changan'];
        if (chineseBrands.includes(brandName)) return 'Китай';

        const frenchBrands = ['Renault', 'Peugeot', 'Citroën', 'DS'];
        if (frenchBrands.includes(brandName)) return 'Франция';

        const italianBrands = ['Ferrari', 'Lamborghini', 'Maserati', 'Alfa Romeo', 'Fiat'];
        if (italianBrands.includes(brandName)) return 'Италия';

        const britishBrands = ['Aston Martin', 'Bentley', 'Rolls-Royce', 'Jaguar', 'Land Rover', 'McLaren'];
        if (britishBrands.includes(brandName)) return 'Великобритания';

        const swedishBrands = ['Volvo', 'Saab', 'Koenigsegg', 'Polestar'];
        if (swedishBrands.includes(brandName)) return 'Швеция';

        return 'Другое';
    }

    generateSpecs(brandName, engineInfo, bodyType, year) {
        const { power, volume } = engineInfo;

        const luxuryBrands = ['Ferrari', 'Lamborghini', 'Rolls-Royce', 'Bentley', 'Aston Martin',
                             'Maserati', 'Porsche', 'McLaren', 'Koenigsegg', 'Bugatti'];
        const premiumBrands = ['Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Cadillac', 'Genesis', 'Volvo'];

        let basePrice = 1500000;
        if (luxuryBrands.includes(brandName)) {
            basePrice = 15000000;
        } else if (premiumBrands.includes(brandName)) {
            basePrice = 4000000;
        }

        const priceMultiplier = 1 + (power / 300);
        const priceMin = Math.round(basePrice * priceMultiplier);
        const priceMax = Math.round(priceMin * 1.5);

        let fuelConsumption;
        if (engineInfo.fuelType === 'Электро') {
            fuelConsumption = Math.round((15 + (power / 50)) * 10) / 10;
        } else if (engineInfo.fuelType === 'Гибрид') {
            fuelConsumption = Math.round((4 + (volume * 1.5)) * 10) / 10;
        } else if (engineInfo.fuelType === 'Дизель') {
            fuelConsumption = Math.round((5 + (volume * 1.2)) * 10) / 10;
        } else {
            fuelConsumption = Math.round((7 + (volume * 2)) * 10) / 10;
        }

        const acceleration = power > 500
            ? Math.round((2.5 + (1000 / power)) * 10) / 10
            : Math.round((3 + (600 / power)) * 10) / 10;

        const maxSpeed = power > 500
            ? Math.round(250 + (power / 5))
            : Math.round(180 + (power / 3));

        let maintenanceCost = Math.round(100000 + (power * 200) + (volume * 15000));
        if (luxuryBrands.includes(brandName)) {
            maintenanceCost *= 3;
        } else if (premiumBrands.includes(brandName)) {
            maintenanceCost *= 1.8;
        }

        return {
            priceMin,
            priceMax,
            fuelConsumption,
            acceleration,
            maxSpeed,
            maintenanceCost: Math.round(maintenanceCost)
        };
    }

    generateSqlDump(outputFile) {
        console.log(`📝 Generating SQL dump: ${outputFile}`);

        const lines = [];

        // Header
        lines.push('-- Cars Database Dump');
        lines.push(`-- Generated: ${new Date().toISOString()}`);
        lines.push(`-- Brands: ${this.brands.length}`);
        lines.push(`-- Models: ${this.models.length}`);
        lines.push(`-- Modifications: ${this.modifications.length}`);
        lines.push('');
        lines.push("SET client_encoding = 'UTF8';");
        lines.push('SET standard_conforming_strings = on;');
        lines.push('');
        lines.push('BEGIN;');
        lines.push('');

        // Countries
        lines.push('-- Countries');
        const countries = this.getUniqueCountries();
        lines.push('INSERT INTO "Country" (id, name, code, "createdAt", "updatedAt") VALUES');
        const countryValues = countries.map((country, i) => {
            const code = this.countryCode(country);
            return `(${i + 1}, '${country}', '${code}', NOW(), NOW())`;
        });
        lines.push(countryValues.join(',\n') + ';');
        lines.push('');

        // Cities
        lines.push('-- Cities');
        const cities = this.getSampleCities();
        lines.push('INSERT INTO "City" (id, name, "countryId", "createdAt", "updatedAt") VALUES');
        const cityValues = cities.map(([city, country], i) => {
            const countryId = countries.indexOf(country) + 1;
            return `(${i + 1}, '${city}', ${countryId}, NOW(), NOW())`;
        });
        lines.push(cityValues.join(',\n') + ';');
        lines.push('');

        // Body types
        lines.push('-- Body Types');
        const bodyTypesList = Array.from(this.bodyTypes).sort();
        lines.push('INSERT INTO "BodyType" (id, name, "createdAt", "updatedAt") VALUES');
        const bodyTypeValues = bodyTypesList.map((type, i) =>
            `(${i + 1}, '${type}', NOW(), NOW())`
        );
        lines.push(bodyTypeValues.join(',\n') + ';');
        lines.push('');

        // Fuel types
        lines.push('-- Fuel Types');
        const fuelTypesList = Array.from(this.fuelTypes).sort();
        lines.push('INSERT INTO "FuelType" (id, name, "createdAt", "updatedAt") VALUES');
        const fuelTypeValues = fuelTypesList.map((type, i) =>
            `(${i + 1}, '${type}', NOW(), NOW())`
        );
        lines.push(fuelTypeValues.join(',\n') + ';');
        lines.push('');

        // Transmissions
        lines.push('-- Transmissions');
        const transmissionsList = Array.from(this.transmissions).sort();
        lines.push('INSERT INTO "Transmission" (id, name, "createdAt", "updatedAt") VALUES');
        const transmissionValues = transmissionsList.map((type, i) =>
            `(${i + 1}, '${type}', NOW(), NOW())`
        );
        lines.push(transmissionValues.join(',\n') + ';');
        lines.push('');

        // Drive types
        lines.push('-- Drive Types');
        const driveTypesList = Array.from(this.driveTypes).sort();
        lines.push('INSERT INTO "DriveType" (id, name, "createdAt", "updatedAt") VALUES');
        const driveTypeValues = driveTypesList.map((type, i) =>
            `(${i + 1}, '${type}', NOW(), NOW())`
        );
        lines.push(driveTypeValues.join(',\n') + ';');
        lines.push('');

        // Brands
        lines.push('-- Brands');
        lines.push('INSERT INTO "Brand" (id, name, code, country, logo, "isPopular", "createdAt", "updatedAt") VALUES');
        const brandValues = this.brands.map(brand => {
            const isPopular = this.isPopularBrand(brand.name);
            const logo = `https://cdn.example.com/brands/${brand.code.toLowerCase()}.png`;
            return `(${brand.id}, '${this.escape(brand.name)}', '${brand.code}', '${brand.country}', '${logo}', ${isPopular}, NOW(), NOW())`;
        });
        lines.push(brandValues.join(',\n') + ';');
        lines.push('');

        // Models (in batches)
        lines.push('-- Models');
        const batchSize = 1000;
        for (let i = 0; i < this.models.length; i += batchSize) {
            const batch = this.models.slice(i, i + batchSize);
            lines.push('INSERT INTO "Model" (id, name, code, "brandId", "generationId", image, "createdAt", "updatedAt") VALUES');
            const modelValues = batch.map(model => {
                const image = `https://cdn.example.com/models/${model.code.toLowerCase()}.png`;
                return `(${model.id}, '${this.escape(model.name)}', '${this.escape(model.code)}', ${model.brand_id}, '${model.generation_id}', '${image}', NOW(), NOW())`;
            });
            lines.push(modelValues.join(',\n') + ';');
            lines.push('');
        }

        // Specifications (in batches)
        lines.push('-- Specifications');
        for (let i = 0; i < this.modifications.length; i += batchSize) {
            const batch = this.modifications.slice(i, i + batchSize);
            lines.push('INSERT INTO "Specification" (id, "modelId", "brandId", name, "externalId", "bodyTypeId", "engineVolume", horsepower, "fuelTypeId", "transmissionId", "driveTypeId", "yearFrom", "yearTo", "priceMin", "priceMax", "fuelConsumption", "acceleration0to100", "maxSpeed", "maintenanceCostPerYear", "createdAt", "updatedAt") VALUES');
            const specValues = batch.map(mod => {
                const bodyTypeId = bodyTypesList.indexOf(mod.body_type) + 1;
                const fuelTypeId = fuelTypesList.indexOf(mod.fuel_type) + 1;
                const transmissionId = transmissionsList.indexOf(mod.transmission) + 1;
                const driveTypeId = mod.drive_type ? driveTypesList.indexOf(mod.drive_type) + 1 : 'NULL';

                return `(${mod.id}, ${mod.model_id}, ${mod.brand_id}, '${this.escape(mod.name)}', '${mod.external_id}', ${bodyTypeId}, ${mod.engine_volume}, ${mod.horsepower}, ${fuelTypeId}, ${transmissionId}, ${driveTypeId}, ${mod.year_from}, ${mod.year_to}, ${mod.price_min}, ${mod.price_max}, ${mod.fuel_consumption}, ${mod.acceleration_0_100}, ${mod.max_speed}, ${mod.maintenance_cost_per_year}, NOW(), NOW())`;
            });
            lines.push(specValues.join(',\n') + ';');
            lines.push('');
        }

        // Update sequences
        lines.push('-- Update sequences');
        lines.push(`SELECT setval('"Country_id_seq"', ${countries.length}, true);`);
        lines.push(`SELECT setval('"City_id_seq"', ${cities.length}, true);`);
        lines.push(`SELECT setval('"BodyType_id_seq"', ${bodyTypesList.length}, true);`);
        lines.push(`SELECT setval('"FuelType_id_seq"', ${fuelTypesList.length}, true);`);
        lines.push(`SELECT setval('"Transmission_id_seq"', ${transmissionsList.length}, true);`);
        lines.push(`SELECT setval('"DriveType_id_seq"', ${driveTypesList.length}, true);`);
        lines.push(`SELECT setval('"Brand_id_seq"', ${this.brands.length}, true);`);
        lines.push(`SELECT setval('"Model_id_seq"', ${this.models.length}, true);`);
        lines.push(`SELECT setval('"Specification_id_seq"', ${this.modifications.length}, true);`);
        lines.push('');
        lines.push('COMMIT;');

        fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');
        console.log('✅ SQL dump generated successfully!');
    }

    escape(text) {
        return String(text).replace(/'/g, "''");
    }

    getUniqueCountries() {
        const countries = new Set(this.brands.map(b => b.country));
        return Array.from(countries).sort();
    }

    countryCode(country) {
        const codes = {
            'Россия': 'RU',
            'Германия': 'DE',
            'Япония': 'JP',
            'США': 'US',
            'Южная Корея': 'KR',
            'Китай': 'CN',
            'Франция': 'FR',
            'Италия': 'IT',
            'Великобритания': 'GB',
            'Швеция': 'SE',
            'Другое': 'XX'
        };
        return codes[country] || 'XX';
    }

    getSampleCities() {
        return [
            ['Москва', 'Россия'],
            ['Санкт-Петербург', 'Россия'],
            ['Екатеринбург', 'Россия'],
            ['Новосибирск', 'Россия'],
            ['Казань', 'Россия'],
            ['Berlin', 'Германия'],
            ['München', 'Германия'],
            ['Tokyo', 'Япония'],
            ['Osaka', 'Япония'],
            ['New York', 'США'],
            ['Los Angeles', 'США'],
            ['Seoul', 'Южная Корея'],
            ['Beijing', 'Китай'],
            ['Shanghai', 'Китай'],
            ['Paris', 'Франция'],
            ['Milan', 'Италия'],
            ['London', 'Великобритания'],
            ['Stockholm', 'Швеция']
        ];
    }

    isPopularBrand(brandName) {
        const popular = ['Toyota', 'Honda', 'Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen',
                        'Ford', 'Hyundai', 'Kia', 'Mazda', 'Nissan', 'Lexus',
                        'Lada', 'Renault', 'Peugeot', 'Citroën'];
        return popular.includes(brandName);
    }
}

async function main() {
    const xmlFile = 'C:\\projects\\cars\\cars.xml';
    const outputFile = 'C:\\projects\\cars\\database\\dumps\\initial-data.sql';

    console.log('='.repeat(60));
    console.log('🚗 Cars XML Parser & SQL Dump Generator');
    console.log('='.repeat(60));
    console.log();

    const parser = new CarsXMLParser(xmlFile);
    await parser.parse();
    parser.generateSqlDump(outputFile);

    console.log();
    console.log('='.repeat(60));
    console.log('✅ Done!');
    console.log('='.repeat(60));
    console.log(`\n📄 SQL dump saved to: ${outputFile}`);
    console.log(`📊 Total records:`);
    console.log(`   - Brands: ${parser.brands.length}`);
    console.log(`   - Models: ${parser.models.length}`);
    console.log(`   - Specifications: ${parser.modifications.length}`);
    console.log(`   - Body types: ${parser.bodyTypes.size}`);
    console.log(`   - Fuel types: ${parser.fuelTypes.size}`);
    console.log(`   - Transmissions: ${parser.transmissions.size}`);
    console.log(`   - Drive types: ${parser.driveTypes.size}`);
    console.log();
}

main().catch(console.error);
