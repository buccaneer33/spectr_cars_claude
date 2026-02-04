import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SearchService {
  async searchCars(filters: any) {
    const where: any = {};

    if (filters.budget_min || filters.budget_max) {
      where.priceMin = {
        ...(filters.budget_min && { gte: filters.budget_min }),
        ...(filters.budget_max && { lte: filters.budget_max }),
      };
    }

    if (filters.brand) {
      where.brand = { name: { contains: filters.brand, mode: 'insensitive' } };
    }

    if (filters.year_min || filters.year_max) {
      where.yearFrom = {
        ...(filters.year_min && { gte: filters.year_min }),
      };
    }

    const [specifications, total] = await Promise.all([
      prisma.specification.findMany({
        where,
        include: {
          model: { include: { brand: true } },
          bodyType: true,
          fuelType: true,
          transmission: true,
          driveType: true,
        },
        take: filters.limit,
        skip: filters.offset,
        orderBy: { priceMin: 'asc' },
      }),
      prisma.specification.count({ where }),
    ]);

    return { specifications, total };
  }

  async getBrands() {
    return prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getBodyTypes() {
    return prisma.bodyType.findMany();
  }

  async getFuelTypes() {
    return prisma.fuelType.findMany();
  }
}
