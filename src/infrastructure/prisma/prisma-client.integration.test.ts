import "dotenv/config";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPrismaClient } from "./prisma-client";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined) {
  throw new Error("DATABASE_URL is required for Prisma integration tests.");
}

const prisma = createPrismaClient(databaseUrl);

describe("Prisma PostgreSQL adapter", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("connects to the configured database", async () => {
    const rows = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT current_database() AS database
    `;

    expect(rows).toEqual([{ database: "kunnawolo" }]);
  });
});
