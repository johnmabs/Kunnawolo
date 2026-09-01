import { createPrismaClient } from "../src/infrastructure/prisma/prisma-client";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined) {
  throw new Error("DATABASE_URL is required to run the database seed.");
}

const prisma = createPrismaClient(databaseUrl);

try {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
} finally {
  await prisma.$disconnect();
}
