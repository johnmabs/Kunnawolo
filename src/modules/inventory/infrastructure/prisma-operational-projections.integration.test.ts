import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListInventorySessions } from "../application/list-inventory-sessions";
import { ListStockLossHistory } from "../application/list-stock-loss-history";
import { ListStockMovementHistory } from "../application/list-stock-movement-history";
import { ListStock } from "../application/list-stock";
import { ListStockTransfers } from "../../transfers/application/list-stock-transfers";
import { PrismaStockTransferProjectionRepository } from "../../transfers/infrastructure/prisma-stock-transfer-projection-repository";
import { PrismaInventoryProjectionRepository } from "./prisma-inventory-projection-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for operational projection integration tests.");
const prisma = createPrismaClient(databaseUrl);
const ids = { organization: "projection-list-org", otherOrganization: "projection-list-other-org", shop: "projection-list-shop", destination: "projection-list-destination", otherShop: "projection-list-other-shop", product: "projection-list-product", secondProduct: "projection-list-second-product", otherProduct: "projection-list-other-product", session: "projection-list-session", otherSession: "projection-list-other-session", transfer: "projection-list-transfer", otherTransfer: "projection-list-other-transfer" } as const;

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: ids.organization, name: "Org Ɛ", currency: "XOF" }, { id: ids.otherOrganization, name: "Autre", currency: "XOF" }], skipDuplicates: true });
  await prisma.shop.createMany({ data: [{ id: ids.shop, organizationId: ids.organization, code: "HIST-Ɛ", name: "Boutique historique Ɛ", isActive: false }, { id: ids.destination, organizationId: ids.organization, code: "DEST", name: "Destination" }, { id: ids.otherShop, organizationId: ids.otherOrganization, code: "HIST-Ɛ", name: "Autre boutique" }], skipDuplicates: true });
  await prisma.product.createMany({ data: [{ id: ids.product, organizationId: ids.organization, name: "Café Ɛ", code: "MED-Ɛ" }, { id: ids.secondProduct, organizationId: ids.organization, name: "Thé", code: "THE" }, { id: ids.otherProduct, organizationId: ids.otherOrganization, name: "Café étranger", code: "MED-Ɛ" }], skipDuplicates: true });
  await prisma.stockLevel.createMany({ data: [{ id: "projection-list-level", organizationId: ids.organization, shopId: ids.shop, productId: ids.product, quantity: 2, lowStockThreshold: 3 }, { id: "projection-list-other-level", organizationId: ids.otherOrganization, shopId: ids.otherShop, productId: ids.otherProduct, quantity: 99, lowStockThreshold: 0 }], skipDuplicates: true });
  await prisma.inventorySession.createMany({ data: [{ id: ids.session, organizationId: ids.organization, shopId: ids.shop, status: "OPEN", openedAt: new Date("2026-09-01T09:00:00Z") }, { id: ids.otherSession, organizationId: ids.otherOrganization, shopId: ids.otherShop, status: "CLOSED", openedAt: new Date("2026-09-01T09:00:00Z"), closedAt: new Date("2026-09-01T10:00:00Z") }], skipDuplicates: true });
  await prisma.inventorySessionLine.createMany({ data: [{ id: "projection-list-session-line-1", inventorySessionId: ids.session, productId: ids.product, expectedQuantity: 4, countedQuantity: 2 }, { id: "projection-list-session-line-2", inventorySessionId: ids.session, productId: ids.secondProduct, expectedQuantity: 1, countedQuantity: null }], skipDuplicates: true });
  await prisma.stockMovement.createMany({ data: [{ id: "projection-list-movement", organizationId: ids.organization, shopId: ids.shop, productId: ids.product, quantityDelta: -2, reason: "Café cassé Ɛ", actorId: "actor", occurredAt: new Date("2026-09-01T10:00:00Z") }, { id: "projection-list-other-movement", organizationId: ids.otherOrganization, shopId: ids.otherShop, productId: ids.otherProduct, quantityDelta: 99, reason: "Autre", occurredAt: new Date("2026-09-01T10:00:00Z") }], skipDuplicates: true });
  await prisma.stockLoss.createMany({ data: [{ id: "projection-list-loss", organizationId: ids.organization, shopId: ids.shop, productId: ids.product, quantity: 2, reason: "Casse Ɛ", referenceCostMinor: 125, currency: "XOF", actorId: "actor", occurredAt: new Date("2026-09-01T10:00:00Z") }, { id: "projection-list-other-loss", organizationId: ids.otherOrganization, shopId: ids.otherShop, productId: ids.otherProduct, quantity: 9, reason: "Autre", referenceCostMinor: 1, currency: "XOF", occurredAt: new Date("2026-09-01T10:00:00Z") }], skipDuplicates: true });
  await prisma.stockTransfer.createMany({ data: [{ id: ids.transfer, organizationId: ids.organization, sourceShopId: ids.shop, destinationShopId: ids.destination, status: "SENT", shipmentReference: "EXP-Ɛ", sentAt: new Date("2026-09-01T11:00:00Z") }, { id: ids.otherTransfer, organizationId: ids.otherOrganization, sourceShopId: ids.otherShop, destinationShopId: ids.otherShop, status: "DRAFT" }], skipDuplicates: true });
  await prisma.stockTransferLine.createMany({ data: [{ id: "projection-list-transfer-line", stockTransferId: ids.transfer, productId: ids.product, quantity: 2 }, { id: "projection-list-other-transfer-line", stockTransferId: ids.otherTransfer, productId: ids.otherProduct, quantity: 50 }], skipDuplicates: true });
});

afterAll(async () => {
  await prisma.stockTransferLine.deleteMany({ where: { stockTransferId: { in: [ids.transfer, ids.otherTransfer] } } });
  await prisma.stockTransfer.deleteMany({ where: { id: { in: [ids.transfer, ids.otherTransfer] } } });
  await prisma.stockLoss.deleteMany({ where: { id: { in: ["projection-list-loss", "projection-list-other-loss"] } } });
  await prisma.stockMovement.deleteMany({ where: { id: { in: ["projection-list-movement", "projection-list-other-movement"] } } });
  await prisma.inventorySessionLine.deleteMany({ where: { inventorySessionId: { in: [ids.session, ids.otherSession] } } });
  await prisma.inventorySession.deleteMany({ where: { id: { in: [ids.session, ids.otherSession] } } });
  await prisma.stockLevel.deleteMany({ where: { id: { in: ["projection-list-level", "projection-list-other-level"] } } });
  await prisma.product.deleteMany({ where: { id: { in: [ids.product, ids.secondProduct, ids.otherProduct] } } });
  await prisma.shop.deleteMany({ where: { id: { in: [ids.shop, ids.destination, ids.otherShop] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [ids.organization, ids.otherOrganization] } } });
  await prisma.$disconnect();
});

describe("operational stock projections", () => {
  it("lists stock, inventories and histories for an inactive shop without leaking another organization", async () => {
    const repository = new PrismaInventoryProjectionRepository(prisma);
    await expect(new ListStock(repository).execute({ organizationId: ids.organization, shopId: ids.shop, productSearch: "med-ɛ" })).resolves.toMatchObject({ shopName: "Boutique historique Ɛ", items: [{ productName: "Café Ɛ", quantity: 2, lowStockThreshold: 3, isLowStock: true }] });
    await expect(new ListInventorySessions(repository).execute({ organizationId: ids.organization, shopId: ids.shop })).resolves.toMatchObject({ items: [{ status: "OPEN", progressPercentage: 50, discrepancyLineCount: 1, discrepancyQuantity: 2 }] });
    await expect(new ListStockMovementHistory(repository).execute({ organizationId: ids.organization, shopId: ids.shop, productId: ids.product })).resolves.toMatchObject({ items: [{ reason: "Café cassé Ɛ", quantityDelta: -2 }] });
    await expect(new ListStockLossHistory(repository).execute({ organizationId: ids.organization, shopId: ids.shop, productId: ids.product })).resolves.toMatchObject({ items: [{ reason: "Casse Ɛ", totalCostMinor: 250 }] });
    await expect(new ListStock(repository).execute({ organizationId: ids.otherOrganization, shopId: ids.shop })).rejects.toMatchObject({ code: "inventory.shop_not_found" });
  });

  it("lists transfer shops, products, quantities, references and dates within its organization", async () => {
    const projection = await new ListStockTransfers(new PrismaStockTransferProjectionRepository(prisma)).execute({ organizationId: ids.organization, shopId: ids.shop });
    expect(projection.items).toHaveLength(1);
    expect(projection.items[0]).toMatchObject({ sourceShopName: "Boutique historique Ɛ", destinationShopName: "Destination", status: "SENT", productCount: 1, totalQuantity: 2, shipmentReference: "EXP-Ɛ", sentAt: new Date("2026-09-01T11:00:00Z"), lines: [{ productName: "Café Ɛ", quantity: 2 }] });
  });
});
