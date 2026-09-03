import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { RecordStockMovement } from "../application/record-stock-movement";
import { PrismaStockMovementRepository } from "./prisma-stock-movement-repository";
const url = process.env.DATABASE_URL;
if (url === undefined) throw new Error("DATABASE_URL is required.");
const prisma = createPrismaClient(url);
const org = "movement-org";
const shop = "movement-shop";
const product = "movement-product";
beforeAll(async () => {
  await prisma.organization.upsert({
    where: { id: org },
    create: { id: org, name: "Mouvements", currency: "XOF" },
    update: {},
  });
  await prisma.shop.upsert({
    where: { id: shop },
    create: { id: shop, organizationId: org, code: "MVT", name: "Boutique" },
    update: {},
  });
  await prisma.product.upsert({
    where: { id: product },
    create: { id: product, organizationId: org, name: "Nsiirin" },
    update: {},
  });
  await prisma.stockLevel.upsert({
    where: {
      organizationId_shopId_productId: {
        organizationId: org,
        shopId: shop,
        productId: product,
      },
    },
    create: {
      id: "movement-level",
      organizationId: org,
      shopId: shop,
      productId: product,
      quantity: 0,
    },
    update: { quantity: 0 },
  });
});
afterAll(async () => {
  await prisma.stockMovement.deleteMany({ where: { organizationId: org } });
  await prisma.stockLevel.deleteMany({ where: { organizationId: org } });
  await prisma.product.deleteMany({ where: { id: product } });
  await prisma.shop.deleteMany({ where: { id: shop } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId: org } });
  await prisma.organization.deleteMany({ where: { id: org } });
  await prisma.$disconnect();
});
describe("PrismaStockMovementRepository", () => {
  it("updates level and journal atomically without negative stock", async () => {
    let n = 0;
    const record = new RecordStockMovement(
      new PrismaStockMovementRepository(prisma),
      { next: () => Identifier.fromString(`movement-${++n}`) },
      { now: () => new Date() },
    );
    await record.execute({
      organizationId: org,
      shopId: shop,
      productId: product,
      quantityDelta: 3,
      reason: "Entrée Ɛ",
      actorId: "actor",
    });
    await record.execute({
      organizationId: org,
      shopId: shop,
      productId: product,
      quantityDelta: -1,
      reason: "Sortie Ɔ",
      actorId: "actor",
    });
    await expect(
      prisma.stockLevel.findUnique({
        where: {
          organizationId_shopId_productId: {
            organizationId: org,
            shopId: shop,
            productId: product,
          },
        },
      }),
    ).resolves.toMatchObject({ quantity: expect.anything() });
    await expect(
      prisma.stockMovement.count({ where: { organizationId: org } }),
    ).resolves.toBe(2);
    await expect(
      record.execute({
        organizationId: org,
        shopId: shop,
        productId: product,
        quantityDelta: -3,
        reason: "Refus",
        actorId: "actor",
      }),
    ).rejects.toMatchObject({ code: "inventory.insufficient_stock" });
  });
});
