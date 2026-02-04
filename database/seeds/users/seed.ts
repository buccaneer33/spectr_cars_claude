import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_USERS || 'postgresql://postgres:postgres@localhost:5432/users_db',
    },
  },
});

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('🌱 Seeding users database...');

  // Очищаем данные
  console.log('   🗑️  Clearing existing data...');
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  // Админ
  console.log('   👤 Creating admin user...');
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
  console.log('   👥 Creating test users...');
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
    prisma.user.create({
      data: {
        email: 'alex@example.com',
        passwordHash: await hashPassword('password123'),
        name: 'Александр Смирнов',
        role: 'USER',
        status: 'ACTIVE',
        profile: {
          create: {
            preferredBudgetMinRub: 1500000,
            preferredBudgetMaxRub: 2500000,
          },
        },
      },
    }),
  ]);

  console.log('');
  console.log('✅ Users database seeded successfully!');
  console.log(`   Created ${users.length + 1} users`);
  console.log('');
  console.log('   👤 Admin: admin@cars.ru / admin123');
  console.log('   👥 Users:');
  console.log('      - ivan@example.com / password123');
  console.log('      - maria@example.com / password123');
  console.log('      - alex@example.com / password123');
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
