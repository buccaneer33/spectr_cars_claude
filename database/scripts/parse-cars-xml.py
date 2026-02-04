#!/usr/bin/env python3
"""
Parse cars.xml and generate SQL dump for database initialization
"""

import xml.etree.ElementTree as ET
import re
import json
from typing import Dict, List, Set, Tuple
from datetime import datetime

class CarsXMLParser:
    def __init__(self, xml_file: str):
        self.xml_file = xml_file
        self.brands = []
        self.models = []
        self.modifications = []
        self.body_types = set()
        self.fuel_types = set()
        self.transmissions = set()
        self.drive_types = set()

    def parse(self):
        """Parse XML file and extract all data"""
        print("🔄 Parsing cars.xml...")
        tree = ET.parse(self.xml_file)
        root = tree.getroot()

        brand_id_counter = 1
        model_id_counter = 1
        modification_id_counter = 1

        for mark in root.findall('.//mark'):
            brand_name = mark.get('name')
            brand_code = mark.find('code')
            brand_code_text = brand_code.text if brand_code is not None else brand_name.upper()

            # Add brand
            brand_data = {
                'id': brand_id_counter,
                'name': brand_name,
                'code': brand_code_text,
                'country': self._guess_country(brand_name)
            }
            self.brands.append(brand_data)

            # Parse models (folders)
            for folder in mark.findall('.//folder'):
                model_name = folder.get('name')
                generation_id = folder.get('id')

                model_element = folder.find('model')
                model_code = model_element.text if model_element is not None else model_name

                model_data = {
                    'id': model_id_counter,
                    'brand_id': brand_id_counter,
                    'name': model_name,
                    'code': model_code,
                    'generation_id': generation_id
                }
                self.models.append(model_data)

                # Parse modifications
                for modification in folder.findall('.//modification'):
                    mod_name = modification.get('name')
                    mod_id = modification.get('id')

                    body_type_elem = modification.find('body_type')
                    years_elem = modification.find('years')

                    body_type = body_type_elem.text if body_type_elem is not None else 'Седан'
                    years = years_elem.text if years_elem is not None else '2020 - 2024'

                    self.body_types.add(body_type)

                    # Extract technical specs from modification name
                    engine_info = self._parse_modification_name(mod_name)

                    self.fuel_types.add(engine_info['fuel_type'])
                    self.transmissions.add(engine_info['transmission'])
                    if engine_info['drive_type']:
                        self.drive_types.add(engine_info['drive_type'])

                    # Parse years
                    year_from, year_to = self._parse_years(years)

                    # Generate realistic prices and specs
                    specs = self._generate_specs(brand_name, engine_info, body_type, year_from)

                    modification_data = {
                        'id': modification_id_counter,
                        'model_id': model_id_counter,
                        'brand_id': brand_id_counter,
                        'name': mod_name,
                        'external_id': mod_id,
                        'body_type': body_type,
                        'engine_volume': engine_info['volume'],
                        'horsepower': engine_info['power'],
                        'fuel_type': engine_info['fuel_type'],
                        'transmission': engine_info['transmission'],
                        'drive_type': engine_info['drive_type'],
                        'year_from': year_from,
                        'year_to': year_to,
                        'price_min': specs['price_min'],
                        'price_max': specs['price_max'],
                        'fuel_consumption': specs['fuel_consumption'],
                        'acceleration_0_100': specs['acceleration'],
                        'max_speed': specs['max_speed'],
                        'maintenance_cost_per_year': specs['maintenance_cost']
                    }
                    self.modifications.append(modification_data)
                    modification_id_counter += 1

                model_id_counter += 1

            brand_id_counter += 1

        print(f"✅ Parsed: {len(self.brands)} brands, {len(self.models)} models, {len(self.modifications)} modifications")

    def _parse_modification_name(self, mod_name: str) -> Dict:
        """Extract engine specs from modification name like '2.8d MT (177 л.с.) 4WD'"""
        result = {
            'volume': 2.0,
            'power': 150,
            'fuel_type': 'Бензин',
            'transmission': 'MT',
            'drive_type': None
        }

        # Engine volume (e.g., "2.8", "3.5", "5.0")
        volume_match = re.search(r'(\d+\.\d+)', mod_name)
        if volume_match:
            result['volume'] = float(volume_match.group(1))

        # Horsepower (e.g., "177 л.с.", "888 л.с.")
        power_match = re.search(r'(\d+)\s*л\.с\.', mod_name)
        if power_match:
            result['power'] = int(power_match.group(1))

        # Fuel type
        if 'd' in mod_name.lower() and re.search(r'\d+\.\d+d', mod_name.lower()):
            result['fuel_type'] = 'Дизель'
        elif 'hyb' in mod_name.lower():
            result['fuel_type'] = 'Гибрид'
        elif 'electric' in mod_name.lower() or 'ev' in mod_name.lower():
            result['fuel_type'] = 'Электро'
        else:
            result['fuel_type'] = 'Бензин'

        # Transmission
        if 'AT' in mod_name or 'AMT' in mod_name or 'CVT' in mod_name:
            result['transmission'] = 'AT'
        elif 'MT' in mod_name:
            result['transmission'] = 'MT'
        else:
            result['transmission'] = 'AT'  # Default

        # Drive type
        if '4WD' in mod_name or '4X4' in mod_name:
            result['drive_type'] = '4WD'
        elif 'FWD' in mod_name:
            result['drive_type'] = 'FWD'
        elif 'RWD' in mod_name or 'RR' in mod_name:
            result['drive_type'] = 'RWD'

        return result

    def _parse_years(self, years_str: str) -> Tuple[int, int]:
        """Parse year range like '2010 - 2014' or '2024 - по н.в.'"""
        # Default range
        current_year = datetime.now().year
        year_from = current_year - 4
        year_to = current_year

        if not years_str:
            return year_from, year_to

        # Extract start year
        start_match = re.search(r'(\d{4})', years_str)
        if start_match:
            year_from = int(start_match.group(1))

        # Extract end year
        if 'по н.в.' in years_str or 'н.в.' in years_str:
            year_to = current_year
        else:
            end_match = re.findall(r'(\d{4})', years_str)
            if len(end_match) >= 2:
                year_to = int(end_match[1])

        return year_from, year_to

    def _guess_country(self, brand_name: str) -> str:
        """Guess country of origin based on brand name"""
        # Russian brands
        russian_brands = ['Lada', 'ГАЗ', 'УАЗ', 'Москвич', 'Marussia']
        if brand_name in russian_brands:
            return 'Россия'

        # German brands
        german_brands = ['Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen', 'Porsche', 'Opel']
        if brand_name in german_brands:
            return 'Германия'

        # Japanese brands
        japanese_brands = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Lexus', 'Suzuki', 'Isuzu']
        if brand_name in japanese_brands:
            return 'Япония'

        # American brands
        american_brands = ['Ford', 'Chevrolet', 'Dodge', 'Jeep', 'Tesla', 'Cadillac', 'Chrysler']
        if brand_name in american_brands:
            return 'США'

        # Korean brands
        korean_brands = ['Hyundai', 'Kia', 'Genesis', 'Daewoo']
        if brand_name in korean_brands:
            return 'Южная Корея'

        # Chinese brands
        chinese_brands = ['Chery', 'Geely', 'BYD', 'Great Wall', 'Haval', 'Changan']
        if brand_name in chinese_brands:
            return 'Китай'

        # French brands
        french_brands = ['Renault', 'Peugeot', 'Citroën', 'DS']
        if brand_name in french_brands:
            return 'Франция'

        # Italian brands
        italian_brands = ['Ferrari', 'Lamborghini', 'Maserati', 'Alfa Romeo', 'Fiat']
        if brand_name in italian_brands:
            return 'Италия'

        # British brands
        british_brands = ['Aston Martin', 'Bentley', 'Rolls-Royce', 'Jaguar', 'Land Rover', 'McLaren']
        if brand_name in british_brands:
            return 'Великобритания'

        # Swedish brands
        swedish_brands = ['Volvo', 'Saab', 'Koenigsegg', 'Polestar']
        if brand_name in swedish_brands:
            return 'Швеция'

        # Default
        return 'Другое'

    def _generate_specs(self, brand_name: str, engine_info: Dict, body_type: str, year: int) -> Dict:
        """Generate realistic specs based on brand, engine, body type"""
        power = engine_info['power']
        volume = engine_info['volume']

        # Price estimation based on brand prestige and power
        luxury_brands = ['Ferrari', 'Lamborghini', 'Rolls-Royce', 'Bentley', 'Aston Martin',
                        'Maserati', 'Porsche', 'McLaren', 'Koenigsegg', 'Bugatti']
        premium_brands = ['Mercedes-Benz', 'BMW', 'Audi', 'Lexus', 'Cadillac', 'Genesis', 'Volvo']

        base_price = 1500000  # Default base price in rubles

        if brand_name in luxury_brands:
            base_price = 15000000
        elif brand_name in premium_brands:
            base_price = 4000000

        # Adjust by power
        price_multiplier = 1 + (power / 300)
        price_min = int(base_price * price_multiplier)
        price_max = int(price_min * 1.5)

        # Fuel consumption (realistic range)
        if engine_info['fuel_type'] == 'Электро':
            fuel_consumption = round(15 + (power / 50), 1)  # kWh/100km
        elif engine_info['fuel_type'] == 'Гибрид':
            fuel_consumption = round(4 + (volume * 1.5), 1)
        elif engine_info['fuel_type'] == 'Дизель':
            fuel_consumption = round(5 + (volume * 1.2), 1)
        else:  # Бензин
            fuel_consumption = round(7 + (volume * 2), 1)

        # Acceleration (0-100 km/h)
        if power > 500:
            acceleration = round(2.5 + (1000 / power), 1)
        else:
            acceleration = round(3 + (600 / power), 1)

        # Max speed
        if power > 500:
            max_speed = int(250 + (power / 5))
        else:
            max_speed = int(180 + (power / 3))

        # Maintenance cost (yearly, in rubles)
        maintenance_cost = int(100000 + (power * 200) + (volume * 15000))
        if brand_name in luxury_brands:
            maintenance_cost *= 3
        elif brand_name in premium_brands:
            maintenance_cost *= 1.8

        return {
            'price_min': price_min,
            'price_max': price_max,
            'fuel_consumption': fuel_consumption,
            'acceleration': acceleration,
            'max_speed': max_speed,
            'maintenance_cost': maintenance_cost
        }

    def generate_sql_dump(self, output_file: str):
        """Generate SQL dump file"""
        print(f"📝 Generating SQL dump: {output_file}")

        with open(output_file, 'w', encoding='utf-8') as f:
            # Header
            f.write("-- Cars Database Dump\n")
            f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- Brands: {len(self.brands)}\n")
            f.write(f"-- Models: {len(self.models)}\n")
            f.write(f"-- Modifications: {len(self.modifications)}\n")
            f.write("\n")

            f.write("SET client_encoding = 'UTF8';\n")
            f.write("SET standard_conforming_strings = on;\n")
            f.write("\n")

            f.write("BEGIN;\n\n")

            # Countries
            f.write("-- Countries\n")
            countries = self._get_unique_countries()
            f.write('INSERT INTO "Country" (id, name, code, "createdAt", "updatedAt") VALUES\n')
            country_values = []
            for i, country in enumerate(countries, 1):
                code = self._country_code(country)
                country_values.append(
                    f"({i}, '{country}', '{code}', NOW(), NOW())"
                )
            f.write(",\n".join(country_values) + ";\n\n")

            # Cities (sample data)
            f.write("-- Cities\n")
            cities = self._get_sample_cities()
            f.write('INSERT INTO "City" (id, name, "countryId", "createdAt", "updatedAt") VALUES\n')
            city_values = []
            for i, (city, country) in enumerate(cities, 1):
                country_id = countries.index(country) + 1
                city_values.append(
                    f"({i}, '{city}', {country_id}, NOW(), NOW())"
                )
            f.write(",\n".join(city_values) + ";\n\n")

            # Body types
            f.write("-- Body Types\n")
            body_types_list = sorted(list(self.body_types))
            f.write('INSERT INTO "BodyType" (id, name, "createdAt", "updatedAt") VALUES\n')
            body_type_values = []
            for i, body_type in enumerate(body_types_list, 1):
                body_type_values.append(
                    f"({i}, '{body_type}', NOW(), NOW())"
                )
            f.write(",\n".join(body_type_values) + ";\n\n")

            # Fuel types
            f.write("-- Fuel Types\n")
            fuel_types_list = sorted(list(self.fuel_types))
            f.write('INSERT INTO "FuelType" (id, name, "createdAt", "updatedAt") VALUES\n')
            fuel_type_values = []
            for i, fuel_type in enumerate(fuel_types_list, 1):
                fuel_type_values.append(
                    f"({i}, '{fuel_type}', NOW(), NOW())"
                )
            f.write(",\n".join(fuel_type_values) + ";\n\n")

            # Transmissions
            f.write("-- Transmissions\n")
            transmissions_list = sorted(list(self.transmissions))
            f.write('INSERT INTO "Transmission" (id, name, "createdAt", "updatedAt") VALUES\n')
            transmission_values = []
            for i, transmission in enumerate(transmissions_list, 1):
                transmission_values.append(
                    f"({i}, '{transmission}', NOW(), NOW())"
                )
            f.write(",\n".join(transmission_values) + ";\n\n")

            # Drive types
            f.write("-- Drive Types\n")
            drive_types_list = sorted(list(self.drive_types))
            f.write('INSERT INTO "DriveType" (id, name, "createdAt", "updatedAt") VALUES\n')
            drive_type_values = []
            for i, drive_type in enumerate(drive_types_list, 1):
                drive_type_values.append(
                    f"({i}, '{drive_type}', NOW(), NOW())"
                )
            f.write(",\n".join(drive_type_values) + ";\n\n")

            # Brands
            f.write("-- Brands\n")
            f.write('INSERT INTO "Brand" (id, name, code, country, logo, "isPopular", "createdAt", "updatedAt") VALUES\n')
            brand_values = []
            for brand in self.brands:
                is_popular = 'true' if self._is_popular_brand(brand['name']) else 'false'
                logo = f"https://cdn.example.com/brands/{brand['code'].lower()}.png"
                brand_values.append(
                    f"({brand['id']}, '{self._escape(brand['name'])}', '{brand['code']}', '{brand['country']}', '{logo}', {is_popular}, NOW(), NOW())"
                )
            f.write(",\n".join(brand_values) + ";\n\n")

            # Models (in batches to avoid huge INSERT)
            f.write("-- Models\n")
            batch_size = 1000
            for i in range(0, len(self.models), batch_size):
                batch = self.models[i:i+batch_size]
                f.write('INSERT INTO "Model" (id, name, code, "brandId", "generationId", image, "createdAt", "updatedAt") VALUES\n')
                model_values = []
                for model in batch:
                    image = f"https://cdn.example.com/models/{model['code'].lower()}.png"
                    model_values.append(
                        f"({model['id']}, '{self._escape(model['name'])}', '{self._escape(str(model['code']))}', {model['brand_id']}, '{model['generation_id']}', '{image}', NOW(), NOW())"
                    )
                f.write(",\n".join(model_values) + ";\n\n")

            # Specifications (in batches)
            f.write("-- Specifications\n")
            for i in range(0, len(self.modifications), batch_size):
                batch = self.modifications[i:i+batch_size]
                f.write('INSERT INTO "Specification" (id, "modelId", "brandId", name, "externalId", "bodyTypeId", "engineVolume", horsepower, "fuelTypeId", "transmissionId", "driveTypeId", "yearFrom", "yearTo", "priceMin", "priceMax", "fuelConsumption", "acceleration0to100", "maxSpeed", "maintenanceCostPerYear", "createdAt", "updatedAt") VALUES\n')
                spec_values = []
                for mod in batch:
                    body_type_id = body_types_list.index(mod['body_type']) + 1
                    fuel_type_id = fuel_types_list.index(mod['fuel_type']) + 1
                    transmission_id = transmissions_list.index(mod['transmission']) + 1
                    drive_type_id = drive_types_list.index(mod['drive_type']) + 1 if mod['drive_type'] else 'NULL'

                    spec_values.append(
                        f"({mod['id']}, {mod['model_id']}, {mod['brand_id']}, '{self._escape(mod['name'])}', '{mod['external_id']}', {body_type_id}, {mod['engine_volume']}, {mod['horsepower']}, {fuel_type_id}, {transmission_id}, {drive_type_id}, {mod['year_from']}, {mod['year_to']}, {mod['price_min']}, {mod['price_max']}, {mod['fuel_consumption']}, {mod['acceleration_0_100']}, {mod['max_speed']}, {mod['maintenance_cost_per_year']}, NOW(), NOW())"
                    )
                f.write(",\n".join(spec_values) + ";\n\n")

            # Update sequences
            f.write("-- Update sequences\n")
            f.write(f"SELECT setval('\"Country_id_seq\"', {len(countries)}, true);\n")
            f.write(f"SELECT setval('\"City_id_seq\"', {len(cities)}, true);\n")
            f.write(f"SELECT setval('\"BodyType_id_seq\"', {len(body_types_list)}, true);\n")
            f.write(f"SELECT setval('\"FuelType_id_seq\"', {len(fuel_types_list)}, true);\n")
            f.write(f"SELECT setval('\"Transmission_id_seq\"', {len(transmissions_list)}, true);\n")
            f.write(f"SELECT setval('\"DriveType_id_seq\"', {len(drive_types_list)}, true);\n")
            f.write(f"SELECT setval('\"Brand_id_seq\"', {len(self.brands)}, true);\n")
            f.write(f"SELECT setval('\"Model_id_seq\"', {len(self.models)}, true);\n")
            f.write(f"SELECT setval('\"Specification_id_seq\"', {len(self.modifications)}, true);\n")
            f.write("\n")

            f.write("COMMIT;\n")

        print(f"✅ SQL dump generated successfully!")

    def _escape(self, text: str) -> str:
        """Escape single quotes for SQL"""
        return text.replace("'", "''")

    def _get_unique_countries(self) -> List[str]:
        """Get unique list of countries"""
        countries = set(brand['country'] for brand in self.brands)
        return sorted(list(countries))

    def _country_code(self, country: str) -> str:
        """Get country code"""
        codes = {
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
        }
        return codes.get(country, 'XX')

    def _get_sample_cities(self) -> List[Tuple[str, str]]:
        """Get sample cities for each country"""
        return [
            ('Москва', 'Россия'),
            ('Санкт-Петербург', 'Россия'),
            ('Екатеринбург', 'Россия'),
            ('Новосибирск', 'Россия'),
            ('Казань', 'Россия'),
            ('Berlin', 'Германия'),
            ('München', 'Германия'),
            ('Tokyo', 'Япония'),
            ('Osaka', 'Япония'),
            ('New York', 'США'),
            ('Los Angeles', 'США'),
            ('Seoul', 'Южная Корея'),
            ('Beijing', 'Китай'),
            ('Shanghai', 'Китай'),
            ('Paris', 'Франция'),
            ('Milan', 'Италия'),
            ('London', 'Великобритания'),
            ('Stockholm', 'Швеция')
        ]

    def _is_popular_brand(self, brand_name: str) -> bool:
        """Check if brand is popular"""
        popular = ['Toyota', 'Honda', 'Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen',
                  'Ford', 'Hyundai', 'Kia', 'Mazda', 'Nissan', 'Lexus',
                  'Lada', 'Renault', 'Peugeot', 'Citroën']
        return brand_name in popular


def main():
    import sys

    xml_file = '/c/projects/cars/cars.xml'
    output_file = '/c/projects/cars/database/dumps/initial-data.sql'

    print("=" * 60)
    print("🚗 Cars XML Parser & SQL Dump Generator")
    print("=" * 60)
    print()

    parser = CarsXMLParser(xml_file)
    parser.parse()
    parser.generate_sql_dump(output_file)

    print()
    print("=" * 60)
    print("✅ Done!")
    print("=" * 60)
    print(f"\n📄 SQL dump saved to: {output_file}")
    print(f"📊 Total records:")
    print(f"   - Brands: {len(parser.brands)}")
    print(f"   - Models: {len(parser.models)}")
    print(f"   - Specifications: {len(parser.modifications)}")
    print(f"   - Body types: {len(parser.body_types)}")
    print(f"   - Fuel types: {len(parser.fuel_types)}")
    print(f"   - Transmissions: {len(parser.transmissions)}")
    print(f"   - Drive types: {len(parser.drive_types)}")
    print()


if __name__ == '__main__':
    main()
