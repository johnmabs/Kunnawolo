import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { ExpenseCancellation } from "../domain/expense-cancellation";
import type { ExpenseCancellationRepository } from "./ports/expense-cancellation-repository";

export class CancelExpense {
  public constructor(private readonly cancellations: ExpenseCancellationRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {}

  public async execute(input: Readonly<{ organizationId: string; expenseId: string; reference: string; reason: string; actorId: string | null }>): Promise<ExpenseCancellation> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.cancellations.findByReference(input.organizationId, reference);
    if (existing !== null) {
      if (existing.expenseId.value !== input.expenseId) throw new DomainError("expenses.cancellation_reference_taken", "The expense cancellation reference is already used.");
      return existing;
    }
    const cancellation = ExpenseCancellation.create({ id: this.ids.next(), organizationId: Identifier.fromString(input.organizationId), expenseId: Identifier.fromString(input.expenseId), reference, reason: input.reason, actorId: input.actorId, cancelledAt: this.clock.now() });
    return this.cancellations.cancel(cancellation);
  }
}
