import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateShop } from "../application/create-shop";
import type { IdentifierGenerator } from "../application/ports/identifier-generator";
import { PrismaAuditLog } from "./prisma-audit-log";
import { PrismaShopRepository } from "./prisma-shop-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error("DATABASE_URL is required for shop integration tests.");
const organizationId = "shop-integration-org";
const shopId = "shop-integration-id";
const prisma = createPrismaClient(databaseUrl);
const ids: IdentifierGenerator = { next: () => Identifier.fromString(shopId) };

beforeAll(async () => {
  await prisma.organization.upsert({
    where: { id: organizationId },
    create: { id: organizationId, name: "Test", currency: "XOF" },
    update: {},
  });
});
afterAll(async () => {
  await prisma.shop.deleteMany({ where: { id: shopId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.$disconnect();
});

describe("PrismaShopRepository", () => {
  it("persists Unicode shops and audits creation", async () => {
    const create = new CreateShop(
      new PrismaShopRepository(prisma),
      new PrismaAuditLog(prisma),
      ids,
    );
    await create.execute({
      organizationId,
      code: "BKO",
      name: "  Sɔgɔma  ",
      actorId: "actor-1",
    });
    await expect(
      prisma.shop.findUnique({ where: { id: shopId } }),
    ).resolves.toMatchObject({ organizationId, name: "Sɔgɔma" });
    await expect(
      prisma.organizationAudit.findFirst({
        where: { organizationId, action: "shop.created" },
      }),
    ).resolves.toBeTruthy();
  });
});
