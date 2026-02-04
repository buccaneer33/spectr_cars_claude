import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_SEARCH || 'postgresql://postgres:postgres@localhost:5432/search_db',
    },
  },
});

async function main() {
  console.log('🌱 Seeding search database...');
  console.log('');
  console.log('ℹ️  NOTE: Search database should be populated using the SQL dump.');
  console.log('   The dump contains 81,823 car specifications from cars.xml');
  console.log('');
  console.log('   To load the dump, run:');
  console.log('   $ make load-dump');
  console.log('');
  console.log('   This will load:');
  console.log('   - 407 car brands');
  console.log('   - 9,554 models');
  console.log('   - 81,823 specifications');
  console.log('   - All reference data (body types, fuel types, etc.)');
  console.log('');

  // Check if data already exists
  const brandCount = await prisma.brand.count();

  if (brandCount > 0) {
    console.log(`✅ Search database already contains data (${brandCount} brands)`);
    console.log('');
  } else {
    console.log('⚠️  Search database is empty!');
    console.log('   Please run: make load-dump');
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
