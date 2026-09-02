import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { Identifier } from "@/shared/domain/identifier";
import { CancelExpense } from "../application/cancel-expense";
import { RecordExpense } from "../application/record-expense";
import { PrismaExpenseCancellationRepository } from "./prisma-expense-cancellation-repository";
import { PrismaExpenseRepository } from "./prisma-expense-repository";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) throw new Error("DATABASE_URL is required for expense cancellation integration tests.");
const prisma = createPrismaClient(databaseUrl);
const organizationId = "expense-cancellation-org";
const otherOrganizationId = "expense-cancellation-other-org";
const categoryId = "expense-cancellation-category";
const shopId = "expense-cancellation-shop";
let sequence = 0;
const ids = { next: () => Identifier.fromString(`expense-cancellation-${++sequence}`) };
const now = new Date("2026-09-02T11:00:00.000Z");

beforeAll(async () => {
  await prisma.organization.createMany({ data: [{ id: organizationId, name: "Annulations Ɛ", currency: "XOF" }, { id: otherOrganizationId, name: "Autre", currency: "XOF" }], skipDuplicates: true });
  await prisma.expenseCategory.createMany({ data: [{ id: categoryId, organizationId, name: "Transport", isActive: true }], skipDuplicates: true });
  await prisma.shop.upsert({ where: { id: shopId }, create: { id: shopId, organizationId, code: "ANN-Ɛ", name: "Boutique historique" }, update: { isActive: true } });
});

afterAll(async () => {
  await prisma.expenseCancellation.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } });
  await prisma.expense.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } });
  await prisma.organizationAudit.deleteMany({ where: { organizationId: { in: [organizationId, otherOrganizationId] } } });
  await prisma.expenseCategory.deleteMany({ where: { id: categoryId } });
  await prisma.shop.deleteMany({ where: { id: shopId } });
  await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
  await prisma.$disconnect();
});

describe("PrismaExpenseCancellationRepository", () => {
  it("cancels an immutable expense in an inactive historical shop exactly once", async () => {
    const expense = await new RecordExpense(new PrismaExpenseRepository(prisma), ids, { now: () => now }).execute({ organizationId, categoryId, shopId, amountMinor: 3500, currency: "XOF", reference: "DEP-ANN-Ɛ", description: "Transport ɲa", actorId: "creator" });
    await prisma.shop.update({ where: { id: shopId }, data: { isActive: false } });
    const cancel = new CancelExpense(new PrismaExpenseCancellationRepository(prisma), ids, { now: () => now });
    const input = { organizationId, expenseId: expense.id.value, reference: " ANN-Ɛ-001 ", reason: " Saisie Ɛ erronée ", actorId: "actor" };
    await expect(cancel.execute(input)).resolves.toMatchObject({ expenseId: { value: expense.id.value }, reference: "ANN-Ɛ-001", reason: "Saisie Ɛ erronée" });
    await expect(cancel.execute({ ...input, reason: "Autre" })).resolves.toMatchObject({ reference: "ANN-Ɛ-001", reason: "Saisie Ɛ erronée" });
    await expect(cancel.execute({ ...input, reference: "ANN-Ɛ-002" })).rejects.toMatchObject({ code: "expenses.already_cancelled" });
    await expect(cancel.execute({ ...input, organizationId: otherOrganizationId, reference: "ANN-OTHER" })).rejects.toMatchObject({ code: "expenses.expense_not_found" });
    await expect(prisma.expense.findUnique({ where: { id: expense.id.value } })).resolves.toMatchObject({ shopId, amountMinor: BigInt(3500), description: "Transport ɲa" });
    await expect(prisma.expenseCancellation.count({ where: { organizationId, expenseId: expense.id.value } })).resolves.toBe(1);
    await expect(prisma.organizationAudit.count({ where: { organizationId, action: "expense.cancelled:ANN-Ɛ-001" } })).resolves.toBe(1);
  });
});
