import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { ReconcileInventory } from "../application/reconcile-inventory";
import { PrismaInventoryReconciliationRepository } from "./prisma-inventory-reconciliation-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for inventory reconciliation integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "reconciliation-org";
const shopId = "reconciliation-shop";
const productId = "reconciliation-product";
let sequence = 0;
const ids = { next: () => Identifier.fromString(`reconciliation-id-${++sequence}`) };
const now = new Date("2026-09-02T14:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.upsert({ where: { id: organizationId }, create: { id: organizationId, name: "Rapprochement ŋ", currency: "XOF" }, update: {} });
  await prisma.shop.upsert({ where: { id: shopId }, create: { id: shopId, organizationId, code: "RAP", name: "Boutique rapprochée" }, update: { isActive: true } });
  await prisma.product.upsert({ where: { id: productId }, create: { id: productId, organizationId, name: "Produit ɔ", trackInventory: true }, update: { trackInventory: true } });
  await prisma.stockLevel.upsert({ where: { organizationId_shopId_productId: { organizationId, shopId, productId } }, create: { id: "reconciliation-level", organizationId, shopId, productId, quantity: 8 }, update: { quantity: 8 } });
  await prisma.stockMovement.createMany({ data: { id: "reconciliation-movement", organizationId, shopId, productId, quantityDelta: 5, reason: "stock.entry:RAPP-ɔ", actorId: "actor", idempotencyKey: "reconciliation-entry", occurredAt: now }, skipDuplicates: true });
});

afterAll(async () => {
  await prisma.inventoryReconciliationLine.deleteMany({ where: { inventoryReconciliation: { organizationId } } });
  await prisma.inventoryReconciliation.deleteMany({ where: { organizationId } });
  await prisma.stockMovement.deleteMany({ where: { organizationId } });
  await prisma.stockLevel.deleteMany({ where: { organizationId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.shop.deleteMany({ where: { id: shopId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.$disconnect();
});

describe("PrismaInventoryReconciliationRepository", () => {
  it("persists a divergence once in an inactive historical shop and isolates organizations", async () => {
    const reconcile = new ReconcileInventory(new PrismaInventoryReconciliationRepository(prisma), ids, { now: () => now });
    await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } });
    const result = await reconcile.execute({ organizationId, shopId, reference: "  RAPP-ɔ  ", actorId: "actor" });
    await reconcile.execute({ organizationId, shopId, reference: "RAPP-ɔ", actorId: "actor" });
    await expect(prisma.inventoryReconciliation.findFirst({ where: { organizationId, reference: "RAPP-ɔ" }, include: { lines: true } })).resolves.toMatchObject({ shopId, actorId: "actor", reconciledAt: now, lines: [{ productId, stockLevelQuantity: expect.anything(), ledgerQuantity: expect.anything(), quantityDifference: expect.anything() }] });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].quantityDifference).toBe(3);
    await expect(prisma.inventoryReconciliation.count({ where: { organizationId } })).resolves.toBe(1);
    await expect(reconcile.execute({ organizationId: "other-org", shopId, reference: "RAPP-X", actorId: "actor" })).rejects.toMatchObject({ code: "inventory.shop_not_found" });
  });
});
