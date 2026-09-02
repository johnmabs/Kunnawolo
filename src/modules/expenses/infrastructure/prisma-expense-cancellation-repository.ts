import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { ExpenseCancellationRepository } from "../application/ports/expense-cancellation-repository";
import { ExpenseCancellation } from "../domain/expense-cancellation";

type CancellationRow = Readonly<{ id: string; organizationId: string; expenseId: string; cancellationReference: string; reason: string; actorId: string | null; cancelledAt: Date }>;

function toCancellation(row: CancellationRow): ExpenseCancellation {
  return ExpenseCancellation.create({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), expenseId: Identifier.fromString(row.expenseId), reference: row.cancellationReference, reason: row.reason, actorId: row.actorId, cancelledAt: row.cancelledAt });
}

export class PrismaExpenseCancellationRepository implements ExpenseCancellationRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByReference(organizationId: string, reference: string): Promise<ExpenseCancellation | null> {
    const row = await this.prisma.expenseCancellation.findFirst({ where: { organizationId, cancellationReference: reference } });
    return row === null ? null : toCancellation(row);
  }

  public async cancel(cancellation: ExpenseCancellation): Promise<ExpenseCancellation> {
    return this.prisma.$transaction(async (tx) => {
      const byReference = await tx.expenseCancellation.findFirst({ where: { organizationId: cancellation.organizationId.value, cancellationReference: cancellation.reference } });
      if (byReference !== null) {
        if (byReference.expenseId === cancellation.expenseId.value) return toCancellation(byReference);
        throw new DomainError("expenses.cancellation_reference_taken", "The expense cancellation reference is already used.");
      }
      const expense = await tx.expense.findFirst({ where: { id: cancellation.expenseId.value, organizationId: cancellation.organizationId.value } });
      if (expense === null) throw new DomainError("expenses.expense_not_found", "The expense does not belong to this organization.");
      const existingCancellation = await tx.expenseCancellation.findUnique({ where: { expenseId: cancellation.expenseId.value } });
      if (existingCancellation !== null) throw new DomainError("expenses.already_cancelled", "The expense has already been cancelled.");
      await tx.expenseCancellation.create({ data: { id: cancellation.id.value, organizationId: cancellation.organizationId.value, expenseId: cancellation.expenseId.value, cancellationReference: cancellation.reference, reason: cancellation.reason, actorId: cancellation.actorId, cancelledAt: cancellation.cancelledAt } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: cancellation.organizationId.value, actorId: cancellation.actorId, action: `expense.cancelled:${cancellation.reference}` } });
      return cancellation;
    });
  }
}
