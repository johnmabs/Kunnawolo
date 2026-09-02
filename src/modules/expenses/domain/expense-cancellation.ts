import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class ExpenseCancellation {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly expenseId: Identifier,
    public readonly reference: string,
    public readonly reason: string,
    public readonly actorId: string | null,
    public readonly cancelledAt: Date,
  ) {}

  public static create(input: Readonly<{ id: Identifier; organizationId: Identifier; expenseId: Identifier; reference: string; reason: string; actorId: string | null; cancelledAt: Date }>): ExpenseCancellation {
    const reference = input.reference.trim().normalize("NFC");
    const reason = input.reason.trim().normalize("NFC");
    if (reference.length === 0) throw new DomainError("expenses.invalid_cancellation_reference", "An expense cancellation reference must be non-empty.");
    if (reason.length === 0) throw new DomainError("expenses.invalid_cancellation_reason", "An expense cancellation reason must be non-empty.");
    return new ExpenseCancellation(input.id, input.organizationId, input.expenseId, reference, reason, input.actorId, input.cancelledAt);
  }
}
