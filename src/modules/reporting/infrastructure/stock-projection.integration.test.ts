import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { PrismaInventoryReportingSource } from "@/modules/inventory/infrastructure/prisma-inventory-reporting-source";
import { PrismaTransfersReportingSource } from "@/modules/transfers/infrastructure/prisma-transfers-reporting-source";
import { ProjectStock } from "../application/project-stock";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for stock projection integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "stock-projection-org";
const otherOrganizationId = "stock-projection-other-org";
const activeShopId = "stock-projection-active-shop";
const inactiveShopId = "stock-projection-inactive-shop";
const otherShopId = "stock-projection-other-shop";
const productId = "stock-projection-product";
const otherProductId = "stock-projection-other-product";
const occurredAt = new Date("2026-09-02T13:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: organizationId, name: "Stock Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autre", currency: "XOF" }], skipDuplicates: true });
  await prisma.shop.createMany({ data: [{ id: activeShopId, organizationId, code: "STK-Ɛ", name: "Boutique active" }, { id: inactiveShopId, organizationId, code: "STK-Ɔ", name: "Boutique historique" }, { id: otherShopId, organizationId: otherOrganizationId, code: "STK-Ɛ", name: "Autre boutique" }], skipDuplicates: true });
  await prisma.product.createMany({ data: [{ id: productId, organizationId, name: "Nsiirin Ɛ", trackInventory: true }, { id: otherProductId, organizationId: otherOrganizationId, name: "Autre", trackInventory: true }], skipDuplicates: true });
  await prisma.stockLevel.createMany({ data: [{ id: "stock-projection-level-active", organizationId, shopId: activeShopId, productId, quantity: 10 }, { id: "stock-projection-level-inactive", organizationId, shopId: inactiveShopId, productId, quantity: 5 }, { id: "stock-projection-level-other", organizationId: otherOrganizationId, shopId: otherShopId, productId: otherProductId, quantity: 7 }], skipDuplicates: true });
  await prisma.stockLoss.create({ data: { id: "stock-projection-loss", organizationId, shopId: inactiveShopId, productId, quantity: 2, reason: "Perte Ɛ", referenceCostMinor: 500, currency: "XOF", occurredAt } });
  await prisma.inventoryReconciliation.create({ data: { id: "stock-projection-reconciliation", organizationId, shopId: inactiveShopId, reference: "RAPP-Ɛ", reconciledAt: occurredAt, lines: { create: { id: "stock-projection-anomaly", productId, stockLevelId: "stock-projection-level-inactive", stockLevelQuantity: 5, ledgerQuantity: 4, quantityDifference: 1 } } } });
  await prisma.stockTransfer.create({ data: { id: "stock-projection-sent", organizationId, sourceShopId: activeShopId, destinationShopId: inactiveShopId, status: "SENT", shipmentReference: "TRF-SENT", sentAt: occurredAt, lines: { create: { id: "stock-projection-sent-line", productId, quantity: 3 } } } });
  await prisma.stockTransfer.create({ data: { id: "stock-projection-received", organizationId, sourceShopId: activeShopId, destinationShopId: inactiveShopId, status: "RECEIVED", shipmentReference: "TRF-RECEIVED", sentAt: occurredAt, receptionReference: "TRF-RECEIVED-IN", receivedAt: occurredAt, lines: { create: { id: "stock-projection-received-line", productId, quantity: 9 } } } });
  await prisma.shop.update({ where: { id: inactiveShopId }, data: { isActive: false } });
});

afterAll(async () => {
  await prisma.inventoryReconciliationLine.deleteMany({ where: { id: "stock-projection-anomaly" } });
  await prisma.inventoryReconciliation.deleteMany({ where: { id: "stock-projection-reconciliation" } });
  await prisma.stockTransferLine.deleteMany({ where: { id: { in: ["stock-projection-sent-line", "stock-projection-received-line"] } } });
  await prisma.stockTransfer.deleteMany({ where: { id: { in: ["stock-projection-sent", "stock-projection-received"] } } });
  await prisma.stockLoss.deleteMany({ where: { id: "stock-projection-loss" } });
  await prisma.stockLevel.deleteMany({ where: { id: { in: ["stock-projection-level-active", "stock-projection-level-inactive", "stock-projection-level-other"] } } });
  await prisma.product.deleteMany({ where: { id: { in: [productId, otherProductId] } } });
  await prisma.shop.deleteMany({ where: { id: { in: [activeShopId, inactiveShopId, otherShopId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.$disconnect();
});

describe("stock projection", () => {
  it("projects isolated stock, transit, losses, and reconciliation anomalies including inactive shops", async () => {
    const project = new ProjectStock(new PrismaInventoryReportingSource(prisma), new PrismaTransfersReportingSource(prisma));
    await expect(project.execute({ organizationId, occurredFrom: occurredAt, occurredTo: occurredAt })).resolves.toMatchObject({ onHandQuantity: { value: 15 }, inTransitQuantity: { value: 3 }, lossQuantity: { value: 2 }, anomalyCount: 1 });
    await expect(project.execute({ organizationId, shopId: inactiveShopId })).resolves.toMatchObject({ shopId: { value: inactiveShopId }, onHandQuantity: { value: 5 }, inTransitQuantity: { value: 3 }, lossQuantity: { value: 2 }, anomalyCount: 1 });
    await expect(project.execute({ organizationId: otherOrganizationId })).resolves.toMatchObject({ onHandQuantity: { value: 7 }, inTransitQuantity: { value: 0 }, lossQuantity: { value: 0 }, anomalyCount: 0 });
  });
});
