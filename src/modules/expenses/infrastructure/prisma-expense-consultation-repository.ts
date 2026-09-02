import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { ExpenseConsultationRepository, ExpenseListItem } from "../application/ports/expense-consultation-repository";
import type { ExpenseReadScope } from "../application/ports/expense-read-authorization";
import { ExpenseCancellation } from "../domain/expense-cancellation";
import type { ExpenseConsultationFilter } from "../domain/expense-consultation-filter";
import { Expense } from "../domain/expense";

type ExpenseRow = Readonly<{ id: string; organizationId: string; expenseCategoryId: string; shopId: string | null; amountMinor: bigint; currency: string; reference: string; description: string; actorId: string | null; occurredAt: Date; expenseCategory: { name: string }; cancellation: { id: string; organizationId: string; expenseId: string; cancellationReference: string; reason: string; actorId: string | null; cancelledAt: Date } | null }>;

function toItem(row: ExpenseRow): ExpenseListItem {
  const expense = Expense.record({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), categoryId: Identifier.fromString(row.expenseCategoryId), shopId: row.shopId === null ? null : Identifier.fromString(row.shopId), amount: Money.fromMinor(Number(row.amountMinor), row.currency), reference: row.reference, description: row.description, actorId: row.actorId, occurredAt: row.occurredAt });
  const cancellation = row.cancellation === null ? null : ExpenseCancellation.create({ id: Identifier.fromString(row.cancellation.id), organizationId: Identifier.fromString(row.cancellation.organizationId), expenseId: Identifier.fromString(row.cancellation.expenseId), reference: row.cancellation.cancellationReference, reason: row.cancellation.reason, actorId: row.cancellation.actorId, cancelledAt: row.cancellation.cancelledAt });
  return { expense, categoryName: row.expenseCategory.name, cancellation };
}

export class PrismaExpenseConsultationRepository implements ExpenseConsultationRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async list(organizationId: string, filter: ExpenseConsultationFilter, scope: ExpenseReadScope): Promise<readonly ExpenseListItem[]> {
    const rows = await this.prisma.expense.findMany({
      where: {
        organizationId,
        ...(scope.shopIds === null ? {} : { shopId: { in: [...scope.shopIds] } }),
        ...(filter.shopId === null ? {} : { shopId: filter.shopId.value }),
        ...(filter.categoryId === null ? {} : { expenseCategoryId: filter.categoryId.value }),
        ...(filter.query === null ? {} : { OR: [{ reference: { contains: filter.query, mode: "insensitive" } }, { description: { contains: filter.query, mode: "insensitive" } }] }),
        ...(filter.occurredFrom === null && filter.occurredTo === null ? {} : { occurredAt: { ...(filter.occurredFrom === null ? {} : { gte: filter.occurredFrom }), ...(filter.occurredTo === null ? {} : { lte: filter.occurredTo }) } }),
        ...(filter.status === "ALL" ? {} : filter.status === "ACTIVE" ? { cancellation: null } : { cancellation: { isNot: null } }),
      },
      include: { expenseCategory: { select: { name: true } }, cancellation: true },
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    });
    return rows.map(toItem);
  }
}
