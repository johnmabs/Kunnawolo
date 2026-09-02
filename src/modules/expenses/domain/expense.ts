import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";

export class Expense {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly categoryId: Identifier,
    public readonly shopId: Identifier | null,
    public readonly amount: Money,
    public readonly reference: string,
    public readonly description: string,
    public readonly actorId: string | null,
    public readonly occurredAt: Date,
  ) {}

  public static record(input: Readonly<{ id: Identifier; organizationId: Identifier; categoryId: Identifier; shopId: Identifier | null; amount: Money; reference: string; description: string; actorId: string | null; occurredAt: Date }>): Expense {
    if (!input.amount.isPositive()) throw new DomainError("expenses.invalid_amount", "An expense amount must be strictly positive.");
    const reference = input.reference.trim().normalize("NFC");
    if (reference.length === 0) throw new DomainError("expenses.invalid_reference", "An expense reference must be non-empty.");
    const description = input.description.trim().normalize("NFC");
    if (description.length === 0) throw new DomainError("expenses.invalid_description", "An expense description must be non-empty.");
    return new Expense(input.id, input.organizationId, input.categoryId, input.shopId, input.amount, reference, description, input.actorId, input.occurredAt);
  }
}
