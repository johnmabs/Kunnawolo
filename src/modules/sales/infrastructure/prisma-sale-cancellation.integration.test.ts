import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CancelSale } from "../application/cancel-sale";
import { CreateSaleCart } from "../application/create-sale-cart";
import { FinalizeSaleCart } from "../application/finalize-sale-cart";
import { RecordSalePayment } from "../application/record-sale-payment";
import { SaveSaleLine } from "../application/save-sale-line";
import { PrismaSaleCancellationRepository } from "./prisma-sale-cancellation-repository";
import { PrismaSaleCartRepository } from "./prisma-sale-cart-repository";
import { PrismaSaleFinalizationRepository } from "./prisma-sale-finalization-repository";
import { PrismaSalePaymentRepository } from "./prisma-sale-payment-repository";
import { PrismaSalesCancellationAuthorization } from "./prisma-sales-cancellation-authorization";
import { PrismaSalesScope } from "./prisma-sales-scope";
const url = process.env.DATABASE_URL;
if (url === undefined)
  throw new Error(
    "DATABASE_URL is required for sale cancellation integration tests.",
  );
const prisma = createPrismaClient(url);
const org = "cancel-org";
const shop = "cancel-shop";
const product = "cancel-product";
const manager = "cancel-manager";
const cashier = "cancel-cashier";
let next = 0;
const ids = { next: () => Identifier.fromString(`cancel-id-${++next}`) };
const now = new Date("2026-09-01T17:00:00.000Z");
beforeAll(async () => {
  await prisma.organization.upsert({
    where: { id: org },
    create: { id: org, name: "Annulations", currency: "XOF" },
    update: {},
  });
  await prisma.userAccount.createMany({
    data: [
      {
        id: manager,
        email: "cancel-manager@example.test",
        displayName: "Manager",
      },
      {
        id: cashier,
        email: "cancel-cashier@example.test",
        displayName: "Cashier",
      },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.upsert({
    where: { id: shop },
    create: { id: shop, organizationId: org, code: "CAN", name: "Boutique" },
    update: { isActive: true },
  });
  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userAccountId: {
        organizationId: org,
        userAccountId: manager,
      },
    },
    create: {
      id: "cancel-manager-membership",
      organizationId: org,
      userAccountId: manager,
      status: "ACTIVE",
      role: "MANAGER",
      activatedAt: now,
    },
    update: { status: "ACTIVE", role: "MANAGER" },
  });
  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userAccountId: {
        organizationId: org,
        userAccountId: cashier,
      },
    },
    create: {
      id: "cancel-cashier-membership",
      organizationId: org,
      userAccountId: cashier,
      status: "ACTIVE",
      role: "CASHIER",
      activatedAt: now,
    },
    update: { status: "ACTIVE", role: "CASHIER" },
  });
  await prisma.shopAssignment.upsert({
    where: {
      membershipId_shopId: {
        membershipId: "cancel-manager-membership",
        shopId: shop,
      },
    },
    create: {
      id: "cancel-manager-assignment",
      membershipId: "cancel-manager-membership",
      shopId: shop,
    },
    update: {},
  });
  await prisma.product.upsert({
    where: { id: product },
    create: {
      id: product,
      organizationId: org,
      name: "Nsiirin Ɛ",
      trackInventory: true,
    },
    update: { isActive: true, trackInventory: true },
  });
  await prisma.productPrice.upsert({
    where: { id: "cancel-price" },
    create: {
      id: "cancel-price",
      organizationId: org,
      productId: product,
      referenceCostMinor: 500,
      salePriceMinor: 800,
      currency: "XOF",
      reference: "Tarif",
      actorId: manager,
    },
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
      id: "cancel-level",
      organizationId: org,
      shopId: shop,
      productId: product,
      quantity: 5,
    },
    update: { quantity: 5 },
  });
});
afterAll(async () => {
  await prisma.stockMovement.deleteMany({ where: { organizationId: org } });
  await prisma.saleCancellation.deleteMany({ where: { organizationId: org } });
  await prisma.salePayment.deleteMany({ where: { organizationId: org } });
  await prisma.saleLine.deleteMany({
    where: { saleCart: { organizationId: org } },
  });
  await prisma.saleCart.deleteMany({ where: { organizationId: org } });
  await prisma.stockLevel.deleteMany({ where: { organizationId: org } });
  await prisma.productPrice.deleteMany({ where: { id: "cancel-price" } });
  await prisma.product.deleteMany({ where: { id: product } });
  await prisma.shopAssignment.deleteMany({
    where: { id: "cancel-manager-assignment" },
  });
  await prisma.organizationMembership.deleteMany({
    where: {
      id: { in: ["cancel-manager-membership", "cancel-cashier-membership"] },
    },
  });
  await prisma.shop.deleteMany({ where: { id: shop } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId: org } });
  await prisma.salesSequence.deleteMany({ where: { organizationId: org } });
  await prisma.organization.deleteMany({ where: { id: org } });
  await prisma.userAccount.deleteMany({
    where: { id: { in: [manager, cashier] } },
  });
  await prisma.$disconnect();
});
describe("PrismaSaleCancellationRepository", () => {
  it("authorizes a manager and compensates stock/payment idempotently", async () => {
    const carts = new PrismaSaleCartRepository(prisma);
    const scope = new PrismaSalesScope(prisma);
    const finalizations = new PrismaSaleFinalizationRepository(prisma);
    const cart = await new CreateSaleCart(scope, carts, ids).execute({
      organizationId: org,
      shopId: shop,
      actorId: manager,
    });
    await new SaveSaleLine(scope, carts, ids).execute({
      organizationId: org,
      cartId: cart.id.value,
      productId: product,
      quantity: 2,
      discountMinor: 0,
      actorId: manager,
    });
    await new FinalizeSaleCart(carts, finalizations, {
      now: () => now,
    }).execute({
      organizationId: org,
      cartId: cart.id.value,
      reference: "Vente ANN",
      actorId: manager,
    });
    await new RecordSalePayment(
      finalizations,
      new PrismaSalePaymentRepository(prisma),
      ids,
      { now: () => now },
    ).execute({
      organizationId: org,
      cartId: cart.id.value,
      paymentReference: "PAY ANN",
      method: "CASH",
      amountMinor: 1600,
      currency: "XOF",
      actorId: manager,
    });
    const cancel = new CancelSale(
      finalizations,
      new PrismaSaleCancellationRepository(prisma),
      new PrismaSalesCancellationAuthorization(prisma),
      ids,
      { now: () => now },
    );
    await expect(
      cancel.execute({
        organizationId: org,
        cartId: cart.id.value,
        reference: "  ANN-Ɛ  ",
        reason: "  Client ɲa  ",
        actorId: cashier,
      }),
    ).rejects.toMatchObject({ code: "sales.cancellation_forbidden" });
    await cancel.execute({
      organizationId: org,
      cartId: cart.id.value,
      reference: "  ANN-Ɛ  ",
      reason: "  Client ɲa  ",
      actorId: manager,
    });
    await cancel.execute({
      organizationId: org,
      cartId: cart.id.value,
      reference: "ANN-Ɛ",
      reason: "Client ɲa",
      actorId: manager,
    });
    expect(
      Number(
        (
          await prisma.stockLevel.findUniqueOrThrow({
            where: {
              organizationId_shopId_productId: {
                organizationId: org,
                shopId: shop,
                productId: product,
              },
            },
          })
        ).quantity,
      ),
    ).toBe(5);
    await expect(
      prisma.saleCart.findUnique({ where: { id: cart.id.value } }),
    ).resolves.toMatchObject({ status: "CANCELLED" });
    await expect(
      prisma.salePayment.findUnique({ where: { saleCartId: cart.id.value } }),
    ).resolves.toMatchObject({ status: "CANCELLED" });
    await expect(
      prisma.stockMovement.count({
        where: { organizationId: org, reason: "sale.cancelled:ANN-Ɛ" },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.saleCancellation.count({ where: { organizationId: org } }),
    ).resolves.toBe(1);
  });
});
