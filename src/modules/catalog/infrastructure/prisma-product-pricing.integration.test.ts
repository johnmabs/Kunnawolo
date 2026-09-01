import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { GetCurrentProductPricing } from "../application/get-current-product-pricing";
import { SetProductPricing } from "../application/set-product-pricing";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { PrismaProductRepository } from "./prisma-product-repository";
import { PrismaProductPricingRepository } from "./prisma-product-pricing-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for product pricing integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "pricing-integration-org"; const otherOrganizationId = "pricing-integration-other-org"; const productId = "pricing-integration-product";
let nextId = 0;
const ids: IdentifierGenerator = { next: () => Identifier.fromString(`pricing-integration-${++nextId}`) };

beforeAll(async () => {
  await prisma.organization.upsert({ where: { id: organizationId }, create: { id: organizationId, name: "Tarifs", currency: "XOF" }, update: {} });
  await prisma.organization.upsert({ where: { id: otherOrganizationId }, create: { id: otherOrganizationId, name: "Autres tarifs", currency: "XOF" }, update: {} });
  await prisma.product.upsert({ where: { id: productId }, create: { id: productId, organizationId, name: "Nsiirin Ɛ Ɔ ɲ ŋ" }, update: {} });
});
afterAll(async () => { await prisma.productPrice.deleteMany({ where: { productId } }); await prisma.product.deleteMany({ where: { id: productId } }); await prisma.organizationAudit.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } }); await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } }); await prisma.$disconnect(); });

describe("PrismaProductPricingRepository", () => {
  it("preserves pricing history, isolation and audit", async () => {
    const products = new PrismaProductRepository(prisma); const prices = new PrismaProductPricingRepository(prisma);
    const set = new SetProductPricing(products, prices, ids, { now: () => new Date("2026-09-01T10:00:00.000Z") });
    await set.execute({ organizationId, productId, referenceCostMinor: 500, salePriceMinor: 800, currency: "XOF", reference: "Tarif Ɛ", actorId: "actor-1" });
    await set.execute({ organizationId, productId, referenceCostMinor: 600, salePriceMinor: 900, currency: "XOF", reference: "Tarif Ɔ", actorId: "actor-2" });
    await expect(new GetCurrentProductPricing(products, prices).execute({ organizationId, productId })).resolves.toMatchObject({ referenceCost: { amountMinor: 600 }, salePrice: { amountMinor: 900 }, reference: "Tarif Ɔ" });
    await expect(prisma.productPrice.count({ where: { organizationId, productId } })).resolves.toBe(2);
    await expect(prisma.organizationAudit.count({ where: { organizationId, action: "product.pricing_set" } })).resolves.toBe(2);
    await expect(new GetCurrentProductPricing(products, prices).execute({ organizationId: otherOrganizationId, productId })).rejects.toMatchObject({ code: "catalog.product_not_found" });
  });
});
