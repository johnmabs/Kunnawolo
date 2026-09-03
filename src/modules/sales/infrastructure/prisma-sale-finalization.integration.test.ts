import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateSaleCart } from "../application/create-sale-cart";
import { FinalizeSaleCart } from "../application/finalize-sale-cart";
import { SaveSaleLine } from "../application/save-sale-line";
import { PrismaSaleCartRepository } from "./prisma-sale-cart-repository";
import { PrismaSaleFinalizationRepository } from "./prisma-sale-finalization-repository";
import { PrismaSalesScope } from "./prisma-sales-scope";

const url = process.env.DATABASE_URL;
if (url === undefined)
  throw new Error(
    "DATABASE_URL is required for sale finalization integration tests.",
  );
const prisma = createPrismaClient(url);
const org = "finalize-org";
const otherOrg = "finalize-other";
const shop = "finalize-shop";
const tracked = "finalize-tracked";
const untracked = "finalize-untracked";
let next = 0;
const ids = { next: () => Identifier.fromString(`finalize-id-${++next}`) };
const now = new Date("2026-09-01T15:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: org, name: "Finalisation", currency: "XOF" },
      { id: otherOrg, name: "Autre", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.upsert({
    where: { id: shop },
    create: { id: shop, organizationId: org, code: "FIN", name: "Boutique Ɛ" },
    update: { isActive: true },
  });
  await prisma.product.upsert({
    where: { id: tracked },
    create: {
      id: tracked,
      organizationId: org,
      name: "Nsiirin Ɛ",
      trackInventory: true,
    },
    update: { isActive: true, trackInventory: true },
  });
  await prisma.product.upsert({
    where: { id: untracked },
    create: {
      id: untracked,
      organizationId: org,
      name: "Service Ɔ",
      trackInventory: false,
    },
    update: { isActive: true, trackInventory: false },
  });
  await prisma.productPrice.createMany({
    data: [
      {
        id: "finalize-price-1",
        organizationId: org,
        productId: tracked,
        referenceCostMinor: 500,
        salePriceMinor: 800,
        currency: "XOF",
        reference: "Tarif Ɛ",
        actorId: "actor",
      },
      {
        id: "finalize-price-2",
        organizationId: org,
        productId: untracked,
        referenceCostMinor: 100,
        salePriceMinor: 200,
        currency: "XOF",
        reference: "Tarif Ɔ",
        actorId: "actor",
      },
    ],
    skipDuplicates: true,
  });
  await prisma.stockLevel.upsert({
    where: {
      organizationId_shopId_productId: {
        organizationId: org,
        shopId: shop,
        productId: tracked,
      },
    },
    create: {
      id: "finalize-level",
      organizationId: org,
      shopId: shop,
      productId: tracked,
      quantity: 5,
    },
    update: { quantity: 5 },
  });
});
afterAll(async () => {
  await prisma.stockMovement.deleteMany({ where: { organizationId: org } });
  await prisma.saleLine.deleteMany({
    where: { saleCart: { organizationId: org } },
  });
  await prisma.saleCart.deleteMany({ where: { organizationId: org } });
  await prisma.stockLevel.deleteMany({ where: { organizationId: org } });
  await prisma.productPrice.deleteMany({ where: { organizationId: org } });
  await prisma.product.deleteMany({
    where: { id: { in: [tracked, untracked] } },
  });
  await prisma.shop.deleteMany({ where: { id: shop } });
  await prisma.organizationAudit.deleteMany({
    where: { organizationId: { in: [org, otherOrg] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [org, otherOrg] } },
  });
  await prisma.$disconnect();
});

describe("PrismaSaleFinalizationRepository", () => {
  it("finalizes idempotently and atomically with tracked stock only", async () => {
    const carts = new PrismaSaleCartRepository(prisma);
    const scope = new PrismaSalesScope(prisma);
    const create = new CreateSaleCart(scope, carts, ids);
    const cart = await create.execute({
      organizationId: org,
      shopId: shop,
      actorId: "actor",
    });
    const save = new SaveSaleLine(scope, carts, ids);
    await save.execute({
      organizationId: org,
      cartId: cart.id.value,
      productId: tracked,
      quantity: 2,
      discountMinor: 0,
      actorId: "actor",
    });
    await save.execute({
      organizationId: org,
      cartId: cart.id.value,
      productId: untracked,
      quantity: 1,
      discountMinor: 0,
      actorId: "actor",
    });
    await prisma.shop.update({
      where: { id: shop },
      data: { isActive: false },
    });
    const finalize = new FinalizeSaleCart(
      carts,
      new PrismaSaleFinalizationRepository(prisma),
      { now: () => now },
    );
    await finalize.execute({
      organizationId: org,
      cartId: cart.id.value,
      reference: "  Vente Ɛ-001  ",
      actorId: "actor",
    });
    await finalize.execute({
      organizationId: org,
      cartId: cart.id.value,
      reference: "Vente Ɛ-001",
      actorId: "actor",
    });
    await expect(
      prisma.saleCart.findUnique({ where: { id: cart.id.value } }),
    ).resolves.toMatchObject({
      status: "FINALIZED",
      finalizationReference: "Vente Ɛ-001",
      finalizedAt: now,
    });
    await expect(
      prisma.stockLevel.findUnique({
        where: {
          organizationId_shopId_productId: {
            organizationId: org,
            shopId: shop,
            productId: tracked,
          },
        },
      }),
    ).resolves.toMatchObject({ quantity: expect.objectContaining({}) });
    expect(
      Number(
        (
          await prisma.stockLevel.findUniqueOrThrow({
            where: {
              organizationId_shopId_productId: {
                organizationId: org,
                shopId: shop,
                productId: tracked,
              },
            },
          })
        ).quantity,
      ),
    ).toBe(3);
    await expect(
      prisma.stockMovement.count({
        where: { organizationId: org, reason: "sale.finalized:Vente Ɛ-001" },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.organizationAudit.count({
        where: { organizationId: org, action: "sale.finalized" },
      }),
    ).resolves.toBe(1);
  });

  it("rolls back the sale and movement when stock is insufficient", async () => {
    await prisma.shop.update({ where: { id: shop }, data: { isActive: true } });
    const carts = new PrismaSaleCartRepository(prisma);
    const scope = new PrismaSalesScope(prisma);
    const cart = await new CreateSaleCart(scope, carts, ids).execute({
      organizationId: org,
      shopId: shop,
      actorId: "actor",
    });
    await new SaveSaleLine(scope, carts, ids).execute({
      organizationId: org,
      cartId: cart.id.value,
      productId: tracked,
      quantity: 4,
      discountMinor: 0,
      actorId: "actor",
    });
    const finalize = new FinalizeSaleCart(
      carts,
      new PrismaSaleFinalizationRepository(prisma),
      { now: () => now },
    );
    await expect(
      finalize.execute({
        organizationId: org,
        cartId: cart.id.value,
        reference: "Vente refusée",
        actorId: "actor",
      }),
    ).rejects.toMatchObject({ code: "sales.insufficient_stock" });
    await expect(
      prisma.saleCart.findUnique({ where: { id: cart.id.value } }),
    ).resolves.toMatchObject({ status: "DRAFT", finalizationReference: null });
    expect(
      Number(
        (
          await prisma.stockLevel.findUniqueOrThrow({
            where: {
              organizationId_shopId_productId: {
                organizationId: org,
                shopId: shop,
                productId: tracked,
              },
            },
          })
        ).quantity,
      ),
    ).toBe(3);
  });
});
