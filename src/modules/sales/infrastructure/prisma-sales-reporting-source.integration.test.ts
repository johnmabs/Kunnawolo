import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ProjectSales } from "@/modules/reporting/application/project-sales";
import { PrismaSalesReportingSource } from "./prisma-sales-reporting-source";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error(
    "DATABASE_URL is required for sales reporting integration tests.",
  );
const prisma = createPrismaClient(databaseUrl);
const organizationId = "sales-projection-org";
const otherOrganizationId = "sales-projection-other-org";
const activeShopId = "sales-projection-active-shop";
const inactiveShopId = "sales-projection-inactive-shop";
const otherShopId = "sales-projection-other-shop";
const productId = "sales-projection-product";
const otherProductId = "sales-projection-other-product";
const firstDay = new Date("2026-09-01T10:00:00.000Z");
const secondDay = new Date("2026-09-02T10:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: organizationId, name: "Projection Ɛ", currency: "XOF" },
      { id: otherOrganizationId, name: "Autre", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.createMany({
    data: [
      {
        id: activeShopId,
        organizationId,
        code: "RPT-Ɛ",
        name: "Boutique active",
      },
      {
        id: inactiveShopId,
        organizationId,
        code: "RPT-Ɔ",
        name: "Boutique historique",
      },
      {
        id: otherShopId,
        organizationId: otherOrganizationId,
        code: "RPT-Ɛ",
        name: "Autre boutique",
      },
    ],
    skipDuplicates: true,
  });
  await prisma.product.createMany({
    data: [
      {
        id: productId,
        organizationId,
        name: "Nsiirin Ɛ",
        trackInventory: false,
      },
      {
        id: otherProductId,
        organizationId: otherOrganizationId,
        name: "Autre",
        trackInventory: false,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.saleCart.createMany({
    data: [
      {
        id: "sales-projection-finalized",
        organizationId,
        shopId: activeShopId,
        status: "FINALIZED",
        finalizationReference: "RPT-1",
        finalizedAt: firstDay,
      },
      {
        id: "sales-projection-paid",
        organizationId,
        shopId: inactiveShopId,
        status: "PAID",
        finalizationReference: "RPT-2",
        finalizedAt: secondDay,
        businessReference: "SALE-RPT-2",
      },
      {
        id: "sales-projection-cancelled",
        organizationId,
        shopId: activeShopId,
        status: "CANCELLED",
        finalizationReference: "RPT-X",
        finalizedAt: secondDay,
      },
      {
        id: "sales-projection-other",
        organizationId: otherOrganizationId,
        shopId: otherShopId,
        status: "FINALIZED",
        finalizationReference: "RPT-OTHER",
        finalizedAt: firstDay,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.saleLine.createMany({
    data: [
      {
        id: "sales-projection-line-1",
        saleCartId: "sales-projection-finalized",
        productId,
        productNameSnapshot: "Nsiirin Ɛ",
        quantity: 2,
        unitPriceMinor: 1000,
        unitCostMinor: 600,
        currency: "XOF",
        discountMinor: 100,
      },
      {
        id: "sales-projection-line-2",
        saleCartId: "sales-projection-paid",
        productId,
        productNameSnapshot: "Nsiirin Ɛ",
        quantity: 1,
        unitPriceMinor: 800,
        unitCostMinor: 500,
        currency: "XOF",
        discountMinor: 0,
      },
      {
        id: "sales-projection-line-x",
        saleCartId: "sales-projection-cancelled",
        productId,
        productNameSnapshot: "Nsiirin Ɛ",
        quantity: 1,
        unitPriceMinor: 9999,
        unitCostMinor: 1,
        currency: "XOF",
        discountMinor: 0,
      },
      {
        id: "sales-projection-line-other",
        saleCartId: "sales-projection-other",
        productId: otherProductId,
        productNameSnapshot: "Autre",
        quantity: 1,
        unitPriceMinor: 700,
        unitCostMinor: 400,
        currency: "XOF",
        discountMinor: 0,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.update({
    where: { id: inactiveShopId },
    data: { isActive: false },
  });
});

afterAll(async () => {
  await prisma.saleLine.deleteMany({
    where: {
      saleCartId: {
        in: [
          "sales-projection-finalized",
          "sales-projection-paid",
          "sales-projection-cancelled",
          "sales-projection-other",
        ],
      },
    },
  });
  await prisma.saleCart.deleteMany({
    where: {
      id: {
        in: [
          "sales-projection-finalized",
          "sales-projection-paid",
          "sales-projection-cancelled",
          "sales-projection-other",
        ],
      },
    },
  });
  await prisma.product.deleteMany({
    where: { id: { in: [productId, otherProductId] } },
  });
  await prisma.shop.deleteMany({
    where: { id: { in: [activeShopId, inactiveShopId, otherShopId] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.$disconnect();
});

describe("PrismaSalesReportingSource", () => {
  it("projects isolated finalized sales from snapshots and retains inactive-shop history", async () => {
    const project = new ProjectSales(new PrismaSalesReportingSource(prisma));
    await expect(
      project.execute({
        organizationId,
        occurredFrom: firstDay,
        occurredTo: secondDay,
      }),
    ).resolves.toMatchObject({
      revenue: { amountMinor: 2700, currency: "XOF" },
      costOfGoodsSold: { amountMinor: 1700 },
      grossMargin: { amountMinor: 1000 },
      saleCount: 2,
    });
    await expect(
      project.execute({ organizationId, shopId: inactiveShopId }),
    ).resolves.toMatchObject({
      shopId: { value: inactiveShopId },
      revenue: { amountMinor: 800 },
      costOfGoodsSold: { amountMinor: 500 },
      grossMargin: { amountMinor: 300 },
      saleCount: 1,
    });
    await expect(
      project.execute({ organizationId: otherOrganizationId }),
    ).resolves.toMatchObject({
      revenue: { amountMinor: 700 },
      costOfGoodsSold: { amountMinor: 400 },
      grossMargin: { amountMinor: 300 },
      saleCount: 1,
    });
  });
});
