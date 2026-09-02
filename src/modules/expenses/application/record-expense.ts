import type { Clock } from "@/shared/domain/clock";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { Expense } from "../domain/expense";
import type { ExpenseRepository } from "./ports/expense-repository";

export class RecordExpense {
  public constructor(private readonly expenses: ExpenseRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {}

  public async execute(input: Readonly<{ organizationId: string; categoryId: string; shopId: string | null; amountMinor: number; currency: string; reference: string; description: string; actorId: string | null }>): Promise<Expense> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.expenses.findByReference(input.organizationId, reference);
    if (existing !== null) return existing;
    const expense = Expense.record({ id: this.ids.next(), organizationId: Identifier.fromString(input.organizationId), categoryId: Identifier.fromString(input.categoryId), shopId: input.shopId === null ? null : Identifier.fromString(input.shopId), amount: Money.fromMinor(input.amountMinor, input.currency), reference, description: input.description, actorId: input.actorId, occurredAt: this.clock.now() });
    return this.expenses.record(expense);
  }
}
