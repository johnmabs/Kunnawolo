import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateSaleCart } from "../application/create-sale-cart";
import { FinalizeSaleCart } from "../application/finalize-sale-cart";
import { RecordSalePayment } from "../application/record-sale-payment";
import { SaveSaleLine } from "../application/save-sale-line";
import { PrismaSaleCartRepository } from "./prisma-sale-cart-repository";
import { PrismaSaleFinalizationRepository } from "./prisma-sale-finalization-repository";
import { PrismaSalePaymentRepository } from "./prisma-sale-payment-repository";
import { PrismaSalesScope } from "./prisma-sales-scope";
const url = process.env.DATABASE_URL;
if (url === undefined)
  throw new Error(
    "DATABASE_URL is required for sale payment integration tests.",
  );
const prisma = createPrismaClient(url);
const org = "payment-org";
const otherOrg = "payment-other";
const shop = "payment-shop";
const product = "payment-product";
let next = 0;
const ids = { next: () => Identifier.fromString(`payment-id-${++next}`) };
const now = new Date("2026-09-01T16:00:00.000Z");
beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: org, name: "Paiements", currency: "XOF" },
      { id: otherOrg, name: "Autre", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.upsert({
    where: { id: shop },
    create: { id: shop, organizationId: org, code: "PAY", name: "Boutique" },
    update: { isActive: true },
  });
  await prisma.product.upsert({
    where: { id: product },
    create: {
      id: product,
      organizationId: org,
      name: "Nsiirin Ɛ",
      trackInventory: false,
    },
    update: { isActive: true, trackInventory: false },
  });
  await prisma.productPrice.upsert({
    where: { id: "payment-price" },
    create: {
      id: "payment-price",
      organizationId: org,
      productId: product,
      referenceCostMinor: 500,
      salePriceMinor: 800,
      currency: "XOF",
      reference: "Tarif",
      actorId: "actor",
    },
    update: {},
  });
});
afterAll(async () => {
  await prisma.salePayment.deleteMany({ where: { organizationId: org } });
  await prisma.saleLine.deleteMany({
    where: { saleCart: { organizationId: org } },
  });
  await prisma.saleCart.deleteMany({ where: { organizationId: org } });
  await prisma.salesSequence.deleteMany({ where: { organizationId: org } });
  await prisma.productPrice.deleteMany({ where: { id: "payment-price" } });
  await prisma.product.deleteMany({ where: { id: product } });
  await prisma.shop.deleteMany({ where: { id: shop } });
  await prisma.organizationAudit.deleteMany({
    where: { organizationId: { in: [org, otherOrg] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [org, otherOrg] } },
  });
  await prisma.$disconnect();
});
describe("PrismaSalePaymentRepository", () => {
  it("records one exact payment and a sequential business reference", async () => {
    const carts = new PrismaSaleCartRepository(prisma);
    const scope = new PrismaSalesScope(prisma);
    const finalizations = new PrismaSaleFinalizationRepository(prisma);
    const payments = new PrismaSalePaymentRepository(prisma);
    const createFinalized = async (reference: string) => {
      const cart = await new CreateSaleCart(scope, carts, ids).execute({
        organizationId: org,
        shopId: shop,
        actorId: "actor",
      });
      await new SaveSaleLine(scope, carts, ids).execute({
        organizationId: org,
        cartId: cart.id.value,
        productId: product,
        quantity: 2,
        discountMinor: 100,
        actorId: "actor",
      });
      await new FinalizeSaleCart(carts, finalizations, {
        now: () => now,
      }).execute({
        organizationId: org,
        cartId: cart.id.value,
        reference,
        actorId: "actor",
      });
      return cart;
    };
    const firstCart = await createFinalized("Vente 1");
    const record = new RecordSalePayment(finalizations, payments, ids, {
      now: () => now,
    });
    const first = await record.execute({
      organizationId: org,
      cartId: firstCart.id.value,
      paymentReference: "  PAY-Ɛ-1  ",
      method: "CASH",
      amountMinor: 1500,
      currency: "XOF",
      actorId: "actor",
    });
    const retry = await record.execute({
      organizationId: org,
      cartId: firstCart.id.value,
      paymentReference: "PAY-Ɛ-1",
      method: "CASH",
      amountMinor: 1500,
      currency: "XOF",
      actorId: "actor",
    });
    expect(retry.businessReference).toBe(first.businessReference);
    expect(first.businessReference).toBe("SALE-000001");
    const secondCart = await createFinalized("Vente 2");
    const second = await record.execute({
      organizationId: org,
      cartId: secondCart.id.value,
      paymentReference: "PAY-2",
      method: "MOBILE_MONEY",
      amountMinor: 1500,
      currency: "XOF",
      actorId: "actor",
    });
    expect(second.businessReference).toBe("SALE-000002");
    await expect(
      prisma.salePayment.count({ where: { organizationId: org } }),
    ).resolves.toBe(2);
    await expect(
      prisma.saleCart.findUnique({ where: { id: firstCart.id.value } }),
    ).resolves.toMatchObject({
      status: "PAID",
      businessReference: "SALE-000001",
    });
    await expect(
      record.execute({
        organizationId: otherOrg,
        cartId: firstCart.id.value,
        paymentReference: "PAY-other",
        method: "CASH",
        amountMinor: 1500,
        currency: "XOF",
        actorId: "actor",
      }),
    ).rejects.toMatchObject({ code: "sales.sale_not_finalized" });
  });
});
