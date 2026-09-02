import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CreateStockTransfer } from "../application/create-stock-transfer";
import { SaveStockTransferLine } from "../application/save-stock-transfer-line";
import { PrismaStockTransferRepository } from "./prisma-stock-transfer-repository";
import { PrismaTransferScope } from "./prisma-transfer-scope";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for stock transfer integration tests.");

const prisma = createPrismaClient(databaseUrl);
const organizationId = "transfer-org";
const otherOrganizationId = "transfer-other-org";
const sourceShopId = "transfer-source";
const destinationShopId = "transfer-destination";
const productId = "transfer-product";
let nextId = 0;
const ids = { next: () => Identifier.fromString(`transfer-id-${++nextId}`) };

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: organizationId, name: "Transferts Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autre", currency: "XOF" }], skipDuplicates: true });
  await prisma.shop.upsert({ where: { id: sourceShopId }, create: { id: sourceShopId, organizationId, code: "SRC", name: "Source Ɛ" }, update: { isActive: true } });
  await prisma.shop.upsert({ where: { id: destinationShopId }, create: { id: destinationShopId, organizationId, code: "DST", name: "Destination Ɔ" }, update: { isActive: true } });
  await prisma.product.upsert({ where: { id: productId }, create: { id: productId, organizationId, name: "Nsiirin ɲa", trackInventory: true }, update: { isActive: true, trackInventory: true } });
});

afterAll(async () => {
  await prisma.stockTransferLine.deleteMany({ where: { stockTransfer: { organizationId } } });
  await prisma.stockTransfer.deleteMany({ where: { organizationId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.shop.deleteMany({ where: { id: { in: [sourceShopId, destinationShopId] } } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.$disconnect();
});

describe("PrismaStockTransferRepository", () => {
  it("persists an organization-scoped draft and valid Unicode line", async () => {
    const repository = new PrismaStockTransferRepository(prisma);
    const scope = new PrismaTransferScope(prisma);
    const create = new CreateStockTransfer(scope, repository, ids);
    const transfer = await create.execute({ organizationId, sourceShopId, destinationShopId, actorId: "actor-Ɛ" });
    const saveLine = new SaveStockTransferLine(scope, repository, ids);
    await saveLine.execute({ organizationId, transferId: transfer.id.value, productId, quantity: 2, actorId: "actor-Ɛ" });
    await saveLine.execute({ organizationId, transferId: transfer.id.value, productId, quantity: 3, actorId: "actor-Ɛ" });

    await expect(prisma.stockTransfer.findUnique({ where: { id: transfer.id.value }, include: { lines: true } })).resolves.toMatchObject({ organizationId, sourceShopId, destinationShopId, status: "DRAFT", lines: [{ quantity: expect.anything() }] });
    expect(Number((await prisma.stockTransferLine.findFirstOrThrow({ where: { stockTransferId: transfer.id.value } })).quantity)).toBe(3);
    await expect(repository.findDraft(otherOrganizationId, transfer.id.value)).resolves.toBeNull();
    await expect(prisma.organizationAudit.count({ where: { organizationId, action: { startsWith: "transfer." } } })).resolves.toBe(3);

    await prisma.shop.update({ where: { id: sourceShopId }, data: { isActive: false } });
    await expect(repository.findDraft(organizationId, transfer.id.value)).resolves.toMatchObject({ sourceShopId: { value: sourceShopId }, lines: [{ quantity: { value: 3 } }] });
  });

  it("rejects shops from another organization and untracked products", async () => {
    const repository = new PrismaStockTransferRepository(prisma);
    const scope = new PrismaTransferScope(prisma);
    const create = new CreateStockTransfer(scope, repository, ids);
    await expect(create.execute({ organizationId, sourceShopId, destinationShopId: "missing", actorId: null })).rejects.toMatchObject({ code: "transfers.shop_not_found" });
    await expect(create.execute({ organizationId, sourceShopId, destinationShopId: sourceShopId, actorId: null })).rejects.toMatchObject({ code: "transfers.same_source_and_destination" });
  });
});
