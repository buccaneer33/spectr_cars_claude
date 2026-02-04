import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_CHAT || 'postgresql://postgres:postgres@localhost:5432/chat_db',
    },
  },
});

async function main() {
  console.log('🌱 Seeding chat database...');

  // Очищаем данные
  console.log('   🗑️  Clearing existing data...');
  await prisma.searchResult.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();

  console.log('');
  console.log('✅ Chat database ready (empty for production start)');
  console.log('   Chat sessions will be created when users start conversations');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
