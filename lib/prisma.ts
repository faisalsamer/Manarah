import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/app/generated/prisma/client';

// Reuse the same client across hot-reloads in dev so we don't exhaust the
// database connection pool. In production each instance creates its own.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createClient = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env or your deployment environment.',
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
