import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { RecordExpense } from "../application/record-expense";
import { PrismaExpenseRepository } from "./prisma-expense-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error("DATABASE_URL is required for expense integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "expense-org";
const otherOrganizationId = "expense-other-org";
const categoryId = "expense-category";
const inactiveCategoryId = "expense-inactive-category";
const shopId = "expense-shop";
const otherShopId = "expense-other-shop";
let sequence = 0;

beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: organizationId, name: "Dépenses Ɛ", currency: "XOF" },
      { id: otherOrganizationId, name: "Autre", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.expenseCategory.createMany({
    data: [
      { id: categoryId, organizationId, name: "Lɔgɛlɛn", isActive: true },
      {
        id: inactiveCategoryId,
        organizationId,
        name: "Inactive",
        isActive: false,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.shop.upsert({
    where: { id: shopId },
    create: { id: shopId, organizationId, code: "DEP-Ɛ", name: "Sɔgɔma Ɛ" },
    update: { isActive: true },
  });
  await prisma.shop.upsert({
    where: { id: otherShopId },
    create: {
      id: otherShopId,
      organizationId: otherOrganizationId,
      code: "DEP-Ɛ",
      name: "Autre boutique",
    },
    update: { isActive: true },
  });
});

afterAll(async () => {
  await prisma.expense.deleteMany({
    where: { organizationId: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.organizationAudit.deleteMany({
    where: { organizationId: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.expenseCategory.deleteMany({
    where: { organizationId: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.shop.deleteMany({
    where: { id: { in: [shopId, otherShopId] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.$disconnect();
});

describe("PrismaExpenseRepository", () => {
  it("persists shop and organization expenses atomically, idempotently, and keeps an inactive shop history", async () => {
    const repository = new PrismaExpenseRepository(prisma);
    const record = new RecordExpense(
      repository,
      { next: () => Identifier.fromString(`expense-${++sequence}`) },
      { now: () => new Date("2026-09-02T10:00:00.000Z") },
    );
    const shopExpense = await record.execute({
      organizationId,
      categoryId,
      shopId,
      amountMinor: 1500,
      currency: "XOF",
      reference: "DEP-Ɛ-001",
      description: "  Lɔgɛlɛn Fɔ́lɔ  ",
      actorId: "actor",
    });
    const repeated = await record.execute({
      organizationId,
      categoryId,
      shopId: null,
      amountMinor: 1,
      currency: "XOF",
      reference: "DEP-Ɛ-001",
      description: "Ignorée",
      actorId: "actor-2",
    });
    const organizationExpense = await record.execute({
      organizationId,
      categoryId,
      shopId: null,
      amountMinor: 2300,
      currency: "XOF",
      reference: "DEP-ORG-001",
      description: "Loyer",
      actorId: "actor",
    });
    expect(repeated.id.value).toBe(shopExpense.id.value);
    expect(organizationExpense.shopId).toBeNull();
    await prisma.shop.update({
      where: { id: shopId },
      data: { isActive: false },
    });
    await expect(
      prisma.expense.findUnique({ where: { id: shopExpense.id.value } }),
    ).resolves.toMatchObject({
      shopId,
      description: "Lɔgɛlɛn Fɔ́lɔ".normalize("NFC"),
    });
    await expect(
      prisma.expense.count({ where: { organizationId } }),
    ).resolves.toBe(2);
    await expect(
      prisma.organizationAudit.count({
        where: { organizationId, action: "expense.recorded:DEP-Ɛ-001" },
      }),
    ).resolves.toBe(1);
  });

  it("rejects inactive categories and shops outside the active organization scope", async () => {
    const record = new RecordExpense(
      new PrismaExpenseRepository(prisma),
      { next: () => Identifier.fromString(`expense-${++sequence}`) },
      { now: () => new Date() },
    );
    await expect(
      record.execute({
        organizationId,
        categoryId: inactiveCategoryId,
        shopId: null,
        amountMinor: 1,
        currency: "XOF",
        reference: "DEP-INACTIVE-CATEGORY",
        description: "Test",
        actorId: null,
      }),
    ).rejects.toMatchObject({ code: "expenses.category_not_found" });
    await expect(
      record.execute({
        organizationId,
        categoryId,
        shopId,
        amountMinor: 1,
        currency: "XOF",
        reference: "DEP-INACTIVE-SHOP",
        description: "Test",
        actorId: null,
      }),
    ).rejects.toMatchObject({ code: "expenses.shop_not_found" });
    await expect(
      record.execute({
        organizationId,
        categoryId,
        shopId: otherShopId,
        amountMinor: 1,
        currency: "XOF",
        reference: "DEP-OTHER-SHOP",
        description: "Test",
        actorId: null,
      }),
    ).rejects.toMatchObject({ code: "expenses.shop_not_found" });
  });
});
