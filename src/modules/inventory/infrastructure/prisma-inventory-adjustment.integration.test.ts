import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { ApplyInventoryAdjustment } from "../application/apply-inventory-adjustment";
import { PrismaInventorySessionRepository } from "./prisma-inventory-session-repository";
import { PrismaInventoryAdjustmentRepository } from "./prisma-inventory-adjustment-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for inventory adjustment integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "adjustment-org";
const shopId = "adjustment-shop";
const productId = "adjustment-product";
const sessionId = "adjustment-session";
let sequence = 0;
const ids = { next: () => Identifier.fromString(`adjustment-id-${++sequence}`) };
const now = new Date("2026-09-02T12:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.upsert({ where: { id: organizationId }, create: { id: organizationId, name: "Ajustements Ɛ", currency: "XOF" }, update: {} });
  await prisma.shop.upsert({ where: { id: shopId }, create: { id: shopId, organizationId, code: "AJU", name: "Boutique ajustée" }, update: { isActive: true } });
  await prisma.product.upsert({ where: { id: productId }, create: { id: productId, organizationId, name: "Produit ɲ", trackInventory: true }, update: { trackInventory: true } });
  await prisma.stockLevel.upsert({ where: { organizationId_shopId_productId: { organizationId, shopId, productId } }, create: { id: "adjustment-level", organizationId, shopId, productId, quantity: 8 }, update: { quantity: 8 } });
  await prisma.inventorySession.upsert({ where: { id: sessionId }, create: { id: sessionId, organizationId, shopId, status: "CLOSED", openedAt: now, closedAt: now, lines: { create: { id: "adjustment-session-line", productId, expectedQuantity: 8, countedQuantity: 6 } } }, update: { status: "CLOSED", closedAt: now } });
});

afterAll(async () => {
  await prisma.inventoryAdjustmentLine.deleteMany({ where: { inventoryAdjustment: { organizationId } } });
  await prisma.inventoryAdjustment.deleteMany({ where: { organizationId } });
  await prisma.stockMovement.deleteMany({ where: { organizationId } });
  await prisma.inventorySessionLine.deleteMany({ where: { inventorySession: { organizationId } } });
  await prisma.inventorySession.deleteMany({ where: { organizationId } });
  await prisma.stockLevel.deleteMany({ where: { organizationId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.shop.deleteMany({ where: { id: shopId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.organization.deleteMany({ where: { id: organizationId } });
  await prisma.$disconnect();
});

describe("PrismaInventoryAdjustmentRepository", () => {
  it("applies a closed-session discrepancy once, atomically, after shop deactivation", async () => {
    const apply = new ApplyInventoryAdjustment(new PrismaInventorySessionRepository(prisma), new PrismaInventoryAdjustmentRepository(prisma), ids, { now: () => now });
    await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } });
    const adjustment = await apply.execute({ organizationId, sessionId, reference: "  AJU-Ɛ  ", actorId: "actor" });
    await apply.execute({ organizationId, sessionId, reference: "AJU-Ɛ", actorId: "actor" });
    expect(Number((await prisma.stockLevel.findUniqueOrThrow({ where: { organizationId_shopId_productId: { organizationId, shopId, productId } } })).quantity)).toBe(6);
    await expect(prisma.inventoryAdjustment.findUnique({ where: { inventorySessionId: sessionId }, include: { lines: true } })).resolves.toMatchObject({ reference: "AJU-Ɛ", actorId: "actor", adjustedAt: now, lines: [{ expectedQuantity: expect.anything(), countedQuantity: expect.anything(), quantityDelta: expect.anything() }] });
    await expect(prisma.stockMovement.count({ where: { organizationId, reason: "inventory.adjustment:AJU-Ɛ" } })).resolves.toBe(1);
    await expect(prisma.organizationAudit.count({ where: { organizationId, actorId: "actor", action: `inventory_adjustment.applied:${adjustment.id.value}:AJU-Ɛ` } })).resolves.toBe(1);
    await expect(apply.execute({ organizationId: "other-org", sessionId, reference: "AJU-X", actorId: "actor" })).rejects.toMatchObject({ code: "inventory.closed_session_not_found" });
  });
});
