import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ActivateProduct } from "../application/activate-product";
import { DeactivateProduct } from "../application/deactivate-product";
import { SearchProducts } from "../application/search-products";
import { SetProductInventoryTracking } from "../application/set-product-inventory-tracking";
import { PrismaProductRepository } from "./prisma-product-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for product lifecycle integration tests.");
const prisma = createPrismaClient(databaseUrl); const organizationId = "lifecycle-integration-org"; const productId = "lifecycle-integration-product";
beforeAll(async () => { await prisma.organization.upsert({ where: { id: organizationId }, create: { id: organizationId, name: "Cycle", currency: "XOF" }, update: {} }); await prisma.product.upsert({ where: { id: productId }, create: { id: productId, organizationId, name: "Nsiirin Ɛ Ɔ ɲ ŋ", code: "KɔD-Ɛ", barcode: "998" }, update: { isActive: true, trackInventory: true } }); });
afterAll(async () => { await prisma.product.deleteMany({ where: { id: productId } }); await prisma.organizationAudit.deleteMany({ where: { organizationId } }); await prisma.organization.deleteMany({ where: { id: organizationId } }); await prisma.$disconnect(); });

describe("Prisma product lifecycle", () => {
  it("keeps lifecycle history and searches Unicode codes only within the organization", async () => {
    const products = new PrismaProductRepository(prisma);
    await new DeactivateProduct(products).execute({ organizationId, productId, actorId: "actor-1" });
    await expect(new SearchProducts(products).execute({ organizationId, query: "nsiirin", includeInactive: false })).resolves.toEqual([]);
    await new SetProductInventoryTracking(products).execute({ organizationId, productId, trackInventory: false, actorId: "actor-2" });
    await new ActivateProduct(products).execute({ organizationId, productId, actorId: "actor-3" });
    await expect(new SearchProducts(products).execute({ organizationId, query: "kɔd-ɛ" })).resolves.toMatchObject([{ id: { value: productId }, trackInventory: false, isActive: true }]);
    await expect(prisma.organizationAudit.count({ where: { organizationId, action: { in: ["product.deactivated", "product.inventory_tracking_changed", "product.activated"] } } })).resolves.toBe(3);
  });
});
