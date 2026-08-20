import { PrismaClient } from "@prisma/client";

// Normalize DATABASE_URL for SQLite across Local and Vercel serverless environments
const dbUrl =
  process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")
    ? process.env.DATABASE_URL
    : "file:./dev.db";

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("file:")) {
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


