import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaExpensesReportingSource } from "@/modules/expenses/infrastructure/prisma-expenses-reporting-source";
import { PrismaValuedLossReportingSource } from "@/modules/inventory/infrastructure/prisma-valued-loss-reporting-source";
import { ProjectEstimatedResult } from "../application/project-estimated-result";
import { PrismaSalesReportingSource } from "@/modules/sales/infrastructure/prisma-sales-reporting-source";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for estimated-result integration tests.");

const prisma = createPrismaClient(databaseUrl);
const organizationId = "estimated-result-org";
const otherOrganizationId = "estimated-result-other-org";
const activeShopId = "estimated-result-active-shop";
const inactiveShopId = "estimated-result-inactive-shop";
const otherShopId = "estimated-result-other-shop";
const productId = "estimated-result-product";
const otherProductId = "estimated-result-other-product";
const categoryId = "estimated-result-category";
const at = new Date("2026-09-02T12:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: organizationId, name: "Résultat Ɛ", currency: "XOF" },
      { id: otherOrganizationId, name: "Autre résultat", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.createMany({
    data: [
      { id: activeShopId, organizationId, code: "RES-Ɛ", name: "Boutique active" },
      { id: inactiveShopId, organizationId, code: "RES-Ɔ", name: "Boutique historique" },
      { id: otherShopId, organizationId: otherOrganizationId, code: "RES-Ɛ", name: "Autre boutique" },
    ],
    skipDuplicates: true,
  });
  await prisma.product.createMany({
    data: [
      { id: productId, organizationId, name: "Nsiirin ɲa", trackInventory: false },
      { id: otherProductId, organizationId: otherOrganizationId, name: "Autre", trackInventory: false },
    ],
    skipDuplicates: true,
  });
  await prisma.expenseCategory.upsert({
    where: { organizationId_name: { organizationId, name: "Transport ŋa" } },
    create: { id: categoryId, organizationId, name: "Transport ŋa" },
    update: {},
  });
  await prisma.saleCart.createMany({
    data: [
      { id: "estimated-result-sale", organizationId, shopId: inactiveShopId, status: "FINALIZED", finalizationReference: "RES-1", finalizedAt: at },
      { id: "estimated-result-other-sale", organizationId: otherOrganizationId, shopId: otherShopId, status: "FINALIZED", finalizationReference: "RES-OTHER", finalizedAt: at },
    ],
    skipDuplicates: true,
  });
  await prisma.saleLine.createMany({
    data: [
      { id: "estimated-result-sale-line", saleCartId: "estimated-result-sale", productId, productNameSnapshot: "Nsiirin ɲa", quantity: 2, unitPriceMinor: 1000, unitCostMinor: 600, currency: "XOF", discountMinor: 0 },
      { id: "estimated-result-other-sale-line", saleCartId: "estimated-result-other-sale", productId: otherProductId, productNameSnapshot: "Autre", quantity: 1, unitPriceMinor: 9000, unitCostMinor: 1, currency: "XOF", discountMinor: 0 },
    ],
    skipDuplicates: true,
  });
  await prisma.expense.createMany({
    data: [
      { id: "estimated-result-expense", organizationId, expenseCategoryId: categoryId, shopId: inactiveShopId, amountMinor: 300, currency: "XOF", reference: "RES-EXP", description: "Transport Ɛ", occurredAt: at },
      { id: "estimated-result-cancelled-expense", organizationId, expenseCategoryId: categoryId, shopId: inactiveShopId, amountMinor: 500, currency: "XOF", reference: "RES-CANCELLED", description: "À exclure", occurredAt: at },
    ],
    skipDuplicates: true,
  });
  await prisma.expenseCancellation.upsert({
    where: { expenseId: "estimated-result-cancelled-expense" },
    create: { id: "estimated-result-cancellation", organizationId, expenseId: "estimated-result-cancelled-expense", cancellationReference: "RES-ANN", reason: "Erreur", cancelledAt: at },
    update: {},
  });
  await prisma.stockLoss.createMany({
    data: [
      { id: "estimated-result-loss", organizationId, shopId: inactiveShopId, productId, quantity: 2, reason: "Perte ɲa", referenceCostMinor: 100, currency: "XOF", occurredAt: at },
      { id: "estimated-result-other-loss", organizationId: otherOrganizationId, shopId: otherShopId, productId: otherProductId, quantity: 1, reason: "Autre", referenceCostMinor: 9000, currency: "XOF", occurredAt: at },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.update({ where: { id: inactiveShopId }, data: { isActive: false } });
});

afterAll(async () => {
  await prisma.expenseCancellation.deleteMany({ where: { organizationId } });
  await prisma.expense.deleteMany({ where: { organizationId } });
  await prisma.stockLoss.deleteMany({ where: { id: { in: ["estimated-result-loss", "estimated-result-other-loss"] } } });
  await prisma.saleLine.deleteMany({ where: { id: { in: ["estimated-result-sale-line", "estimated-result-other-sale-line"] } } });
  await prisma.saleCart.deleteMany({ where: { id: { in: ["estimated-result-sale", "estimated-result-other-sale"] } } });
  await prisma.expenseCategory.deleteMany({ where: { id: categoryId } });
  await prisma.product.deleteMany({ where: { id: { in: [productId, otherProductId] } } });
  await prisma.shop.deleteMany({ where: { id: { in: [activeShopId, inactiveShopId, otherShopId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.$disconnect();
});

describe("estimated-result reporting", () => {
  it("uses immutable snapshots, excludes cancelled expenses, isolates organizations, and retains inactive-shop history", async () => {
    const project = new ProjectEstimatedResult(
      new PrismaSalesReportingSource(prisma),
      new PrismaExpensesReportingSource(prisma),
      new PrismaValuedLossReportingSource(prisma),
    );

    await expect(project.execute({ organizationId, shopId: inactiveShopId, occurredFrom: at, occurredTo: at })).resolves.toMatchObject({
      grossMargin: { amountMinor: 800, currency: "XOF" },
      activeExpenses: { amountMinor: 300, currency: "XOF" },
      valuedLosses: { amountMinor: 200, currency: "XOF" },
      amount: { amountMinor: 300, currency: "XOF" },
    });
    await expect(project.execute({ organizationId: otherOrganizationId, shopId: otherShopId })).resolves.toMatchObject({ amount: { amountMinor: -1 } });
  });
});
