import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CancelExpense } from "../application/cancel-expense";
import { ListExpenses } from "../application/list-expenses";
import { RecordExpense } from "../application/record-expense";
import { PrismaExpenseCancellationRepository } from "./prisma-expense-cancellation-repository";
import { PrismaExpenseConsultationRepository } from "./prisma-expense-consultation-repository";
import { PrismaExpenseReadAuthorization } from "./prisma-expense-read-authorization";
import { PrismaExpenseRepository } from "./prisma-expense-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error(
    "DATABASE_URL is required for expense consultation integration tests.",
  );
const prisma = createPrismaClient(databaseUrl);
const organizationId = "expense-consultation-org";
const otherOrganizationId = "expense-consultation-other-org";
const categoryId = "expense-consultation-category";
const assignedShopId = "expense-consultation-assigned";
const inactiveShopId = "expense-consultation-inactive";
const ownerId = "expense-consultation-owner";
const managerId = "expense-consultation-manager";
const cashierId = "expense-consultation-cashier";
const now = new Date("2026-09-02T12:00:00.000Z");
let sequence = 0;
const ids = {
  next: () => Identifier.fromString(`expense-consultation-${++sequence}`),
};

beforeAll(async () => {
  await prisma.organization.createMany({
    data: [
      { id: organizationId, name: "Consultation Ɛ", currency: "XOF" },
      { id: otherOrganizationId, name: "Autre", currency: "XOF" },
    ],
    skipDuplicates: true,
  });
  await prisma.expenseCategory.createMany({
    data: [{ id: categoryId, organizationId, name: "Lɔgɛlɛn", isActive: true }],
    skipDuplicates: true,
  });
  await prisma.shop.upsert({
    where: { id: assignedShopId },
    create: {
      id: assignedShopId,
      organizationId,
      code: "EXP-Ɛ",
      name: "Boutique assignée",
    },
    update: { isActive: true },
  });
  await prisma.shop.upsert({
    where: { id: inactiveShopId },
    create: {
      id: inactiveShopId,
      organizationId,
      code: "EXP-Ɔ",
      name: "Boutique historique",
    },
    update: { isActive: true },
  });
  await prisma.userAccount.createMany({
    data: [
      {
        id: ownerId,
        email: "expense-owner@example.test",
        displayName: "Owner",
      },
      {
        id: managerId,
        email: "expense-manager@example.test",
        displayName: "Manager",
      },
      {
        id: cashierId,
        email: "expense-cashier@example.test",
        displayName: "Cashier",
      },
    ],
    skipDuplicates: true,
  });
  await prisma.organizationMembership.createMany({
    data: [
      {
        id: "expense-consultation-owner-membership",
        organizationId,
        userAccountId: ownerId,
        status: "ACTIVE",
        role: "OWNER",
        activatedAt: now,
      },
      {
        id: "expense-consultation-manager-membership",
        organizationId,
        userAccountId: managerId,
        status: "ACTIVE",
        role: "MANAGER",
        activatedAt: now,
      },
      {
        id: "expense-consultation-cashier-membership",
        organizationId,
        userAccountId: cashierId,
        status: "ACTIVE",
        role: "CASHIER",
        activatedAt: now,
      },
    ],
    skipDuplicates: true,
  });
  await prisma.shopAssignment.createMany({
    data: [
      {
        id: "expense-consultation-manager-assignment",
        membershipId: "expense-consultation-manager-membership",
        shopId: assignedShopId,
      },
      {
        id: "expense-consultation-cashier-assignment",
        membershipId: "expense-consultation-cashier-membership",
        shopId: assignedShopId,
      },
    ],
    skipDuplicates: true,
  });
});

afterAll(async () => {
  await prisma.expenseCancellation.deleteMany({ where: { organizationId } });
  await prisma.expense.deleteMany({ where: { organizationId } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId } });
  await prisma.shopAssignment.deleteMany({
    where: {
      id: {
        in: [
          "expense-consultation-manager-assignment",
          "expense-consultation-cashier-assignment",
        ],
      },
    },
  });
  await prisma.organizationMembership.deleteMany({
    where: {
      id: {
        in: [
          "expense-consultation-owner-membership",
          "expense-consultation-manager-membership",
          "expense-consultation-cashier-membership",
        ],
      },
    },
  });
  await prisma.expenseCategory.deleteMany({ where: { id: categoryId } });
  await prisma.shop.deleteMany({
    where: { id: { in: [assignedShopId, inactiveShopId] } },
  });
  await prisma.organization.deleteMany({
    where: { id: { in: [organizationId, otherOrganizationId] } },
  });
  await prisma.userAccount.deleteMany({
    where: { id: { in: [ownerId, managerId, cashierId] } },
  });
  await prisma.$disconnect();
});

describe("expense consultation", () => {
  it("filters Unicode records and enforces organization and shop scopes while retaining inactive-shop history", async () => {
    const record = new RecordExpense(new PrismaExpenseRepository(prisma), ids, {
      now: () => now,
    });
    const assigned = await record.execute({
      organizationId,
      categoryId,
      shopId: assignedShopId,
      amountMinor: 1000,
      currency: "XOF",
      reference: "DEP-ASSIGNED",
      description: "Transport Fɔ́lɔ Ɛ",
      actorId: ownerId,
    });
    await record.execute({
      organizationId,
      categoryId,
      shopId: inactiveShopId,
      amountMinor: 2000,
      currency: "XOF",
      reference: "DEP-HIST",
      description: "Historique Ɔ",
      actorId: ownerId,
    });
    await record.execute({
      organizationId,
      categoryId,
      shopId: null,
      amountMinor: 3000,
      currency: "XOF",
      reference: "DEP-ORG",
      description: "Loyer",
      actorId: ownerId,
    });
    await new CancelExpense(
      new PrismaExpenseCancellationRepository(prisma),
      ids,
      { now: () => now },
    ).execute({
      organizationId,
      expenseId: assigned.id.value,
      reference: "ANN-ASSIGNED",
      reason: "Erreur ɲa",
      actorId: ownerId,
    });
    await prisma.shop.update({
      where: { id: inactiveShopId },
      data: { isActive: false },
    });
    const list = new ListExpenses(
      new PrismaExpenseConsultationRepository(prisma),
      new PrismaExpenseReadAuthorization(prisma),
    );
    await expect(
      list.execute({ organizationId, actorId: ownerId, status: "ALL" }),
    ).resolves.toHaveLength(3);
    await expect(
      list.execute({
        organizationId,
        actorId: ownerId,
        shopId: inactiveShopId,
        status: "ACTIVE",
      }),
    ).resolves.toMatchObject([
      { expense: { reference: "DEP-HIST", shopId: { value: inactiveShopId } } },
    ]);
    await expect(
      list.execute({
        organizationId,
        actorId: ownerId,
        query: "  Fɔ́lɔ Ɛ  ",
        status: "CANCELLED",
      }),
    ).resolves.toMatchObject([
      {
        expense: { reference: "DEP-ASSIGNED" },
        cancellation: { reference: "ANN-ASSIGNED", reason: "Erreur ɲa" },
      },
    ]);
    await expect(
      list.execute({ organizationId, actorId: managerId, status: "ALL" }),
    ).resolves.toMatchObject([
      {
        expense: {
          reference: "DEP-ASSIGNED",
          shopId: { value: assignedShopId },
        },
      },
    ]);
    await expect(
      list.execute({
        organizationId,
        actorId: managerId,
        shopId: inactiveShopId,
        status: "ALL",
      }),
    ).rejects.toMatchObject({ code: "expenses.read_forbidden" });
    await expect(
      list.execute({ organizationId, actorId: cashierId, status: "ALL" }),
    ).rejects.toMatchObject({ code: "expenses.read_forbidden" });
    await expect(
      list.execute({
        organizationId: otherOrganizationId,
        actorId: ownerId,
        status: "ALL",
      }),
    ).rejects.toMatchObject({ code: "expenses.read_forbidden" });
  });
});
