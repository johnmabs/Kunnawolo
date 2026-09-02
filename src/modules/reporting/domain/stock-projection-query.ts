import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class StockProjectionQuery {
  private constructor(public readonly organizationId: Identifier, public readonly shopId: Identifier | null, public readonly occurredFrom: Date | null, public readonly occurredTo: Date | null) {}

  public static create(input: Readonly<{ organizationId: string; shopId?: string | null; occurredFrom?: Date | null; occurredTo?: Date | null }>): StockProjectionQuery {
    const occurredFrom = input.occurredFrom ?? null;
    const occurredTo = input.occurredTo ?? null;
    if (occurredFrom !== null && occurredTo !== null && occurredFrom > occurredTo) throw new DomainError("reporting.invalid_date_range", "The stock projection date range is invalid.");
    return new StockProjectionQuery(Identifier.fromString(input.organizationId), input.shopId === null || input.shopId === undefined ? null : Identifier.fromString(input.shopId), occurredFrom, occurredTo);
  }
}
