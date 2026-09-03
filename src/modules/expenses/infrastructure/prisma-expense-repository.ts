import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { ExpenseRepository } from "../application/ports/expense-repository";
import { Expense } from "../domain/expense";

type ExpenseRow = Readonly<{
  id: string;
  organizationId: string;
  expenseCategoryId: string;
  shopId: string | null;
  amountMinor: bigint;
  currency: string;
  reference: string;
  description: string;
  actorId: string | null;
  occurredAt: Date;
}>;

function toExpense(row: ExpenseRow): Expense {
  return Expense.record({
    id: Identifier.fromString(row.id),
    organizationId: Identifier.fromString(row.organizationId),
    categoryId: Identifier.fromString(row.expenseCategoryId),
    shopId: row.shopId === null ? null : Identifier.fromString(row.shopId),
    amount: Money.fromMinor(Number(row.amountMinor), row.currency),
    reference: row.reference,
    description: row.description,
    actorId: row.actorId,
    occurredAt: row.occurredAt,
  });
}

export class PrismaExpenseRepository implements ExpenseRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByReference(
    organizationId: string,
    reference: string,
  ): Promise<Expense | null> {
    const row = await this.prisma.expense.findFirst({
      where: { organizationId, reference },
    });
    return row === null ? null : toExpense(row);
  }

  public async record(expense: Expense): Promise<Expense> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.expense.findFirst({
        where: {
          organizationId: expense.organizationId.value,
          reference: expense.reference,
        },
      });
      if (existing !== null) return toExpense(existing);
      const organization = await tx.organization.findUnique({
        where: { id: expense.organizationId.value },
        select: { currency: true },
      });
      if (organization === null)
        throw new DomainError(
          "expenses.organization_not_found",
          "The organization does not exist.",
        );
      if (organization.currency !== expense.amount.currency)
        throw new DomainError(
          "expenses.currency_mismatch",
          "The expense currency must match the organization currency.",
        );
      const category = await tx.expenseCategory.findFirst({
        where: {
          id: expense.categoryId.value,
          organizationId: expense.organizationId.value,
          isActive: true,
        },
      });
      if (category === null)
        throw new DomainError(
          "expenses.category_not_found",
          "The active expense category does not belong to this organization.",
        );
      if (expense.shopId !== null) {
        const shop = await tx.shop.findFirst({
          where: {
            id: expense.shopId.value,
            organizationId: expense.organizationId.value,
            isActive: true,
          },
        });
        if (shop === null)
          throw new DomainError(
            "expenses.shop_not_found",
            "The active shop does not belong to this organization.",
          );
      }
      await tx.expense.create({
        data: {
          id: expense.id.value,
          organizationId: expense.organizationId.value,
          expenseCategoryId: expense.categoryId.value,
          shopId: expense.shopId?.value ?? null,
          amountMinor: BigInt(expense.amount.amountMinor),
          currency: expense.amount.currency,
          reference: expense.reference,
          description: expense.description,
          actorId: expense.actorId,
          occurredAt: expense.occurredAt,
        },
      });
      await tx.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: expense.organizationId.value,
          actorId: expense.actorId,
          action: `expense.recorded:${expense.reference}`,
        },
      });
      return expense;
    });
  }
}
