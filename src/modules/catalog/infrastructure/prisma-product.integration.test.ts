import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateProduct } from "../application/create-product";
import { GetProduct } from "../application/get-product";
import { SearchProducts } from "../application/search-products";
import { UpdateProduct } from "../application/update-product";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { Product } from "../domain/product";
import { PrismaProductRepository } from "./prisma-product-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for product integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "product-integration-org";
const otherOrganizationId = "product-integration-other-org";
const productId = "product-integration-id";
const otherProductId = "product-integration-other-id";
const ids: IdentifierGenerator = { next: () => Identifier.fromString(productId) };

beforeAll(async () => {
  await prisma.organization.upsert({ where: { id: organizationId }, create: { id: organizationId, name: "Catalogue", currency: "XOF" }, update: {} });
  await prisma.organization.upsert({ where: { id: otherOrganizationId }, create: { id: otherOrganizationId, name: "Autre catalogue", currency: "XOF" }, update: {} });
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { id: { in: [productId, otherProductId] } } });
  await prisma.shop.deleteMany({ where: { id: "inactive-shop-id" } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.$disconnect();
});

describe("PrismaProductRepository", () => {
  it("persists, reads, updates and finds exact NFC Unicode values within its organization", async () => {
    const repository = new PrismaProductRepository(prisma);
    await new CreateProduct(repository, ids).execute({ organizationId, actorId: "actor-1", name: "  Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ  ", code: "  NSI-Ɛ  ", barcode: "  001  ", packaging: "  Sàc  ", form: "  Pɔ́dɔrɔ  " });
    const created = await new GetProduct(repository).execute({ organizationId, productId });
    expect(created).toMatchObject({ name: "Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ".normalize("NFC"), code: "NSI-Ɛ", barcode: "001", packaging: "Sàc".normalize("NFC"), form: "Pɔ́dɔrɔ".normalize("NFC") });

    await new UpdateProduct(repository).execute({ organizationId, productId, actorId: "actor-2", name: created.name, code: "NSI-Ɛ-2", barcode: "002", packaging: created.packaging, form: created.form, isActive: false });
    await expect(new SearchProducts(repository).execute({ organizationId, query: "nsiirin" })).resolves.toMatchObject([{ id: Identifier.fromString(productId), isActive: false }]);
    await expect(prisma.organizationAudit.findMany({ where: { organizationId, action: { in: ["product.created", "product.updated"] } } })).resolves.toHaveLength(2);
    await expect(new GetProduct(repository).execute({ organizationId: otherOrganizationId, productId })).rejects.toMatchObject({ code: "catalog.product_not_found" });
  });

  it("enforces code and barcode uniqueness per organization while allowing another organization", async () => {
    const repository = new PrismaProductRepository(prisma);
    const duplicateCode = Product.create(Identifier.fromString(otherProductId), Identifier.fromString(organizationId), { name: "Autre", code: "NSI-Ɛ-2", barcode: "999" });
    await expect(repository.save(duplicateCode, { organizationId, actorId: "actor-3", action: "product.created" })).rejects.toMatchObject({ code: "catalog.product_code_taken" });
    const sameCodeElsewhere = Product.create(Identifier.fromString(otherProductId), Identifier.fromString(otherOrganizationId), { name: "Autre", code: "NSI-Ɛ-2", barcode: "002" });
    await expect(repository.save(sameCodeElsewhere, { organizationId: otherOrganizationId, actorId: "actor-3", action: "product.created" })).resolves.toBeUndefined();
  });

  it("keeps an inactive shop and its organization code reserved for history", async () => {
    await prisma.shop.create({ data: { id: "inactive-shop-id", organizationId, code: "HIST-Ɛ", name: "Boutique inactive", isActive: false } });
    await expect(prisma.shop.create({ data: { id: "another-shop-id", organizationId, code: "HIST-Ɛ", name: "Doublon" } })).rejects.toMatchObject({ code: "P2002" });
  });
});
