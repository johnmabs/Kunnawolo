import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type ExpenseStatusFilter = "ALL" | "ACTIVE" | "CANCELLED";

export class ExpenseConsultationFilter {
  private constructor(
    public readonly shopId: Identifier | null,
    public readonly categoryId: Identifier | null,
    public readonly query: string | null,
    public readonly occurredFrom: Date | null,
    public readonly occurredTo: Date | null,
    public readonly status: ExpenseStatusFilter,
  ) {}

  public static create(input: Readonly<{ shopId?: string | null; categoryId?: string | null; query?: string | null; occurredFrom?: Date | null; occurredTo?: Date | null; status?: string | null }>): ExpenseConsultationFilter {
    const status = input.status ?? "ACTIVE";
    if (status !== "ALL" && status !== "ACTIVE" && status !== "CANCELLED") throw new DomainError("expenses.invalid_status_filter", "The expense status filter is unsupported.");
    if (input.occurredFrom !== null && input.occurredFrom !== undefined && input.occurredTo !== null && input.occurredTo !== undefined && input.occurredFrom > input.occurredTo) throw new DomainError("expenses.invalid_date_range", "The expense date range is invalid.");
    const query = input.query?.trim().normalize("NFC") ?? null;
    return new ExpenseConsultationFilter(input.shopId === null || input.shopId === undefined ? null : Identifier.fromString(input.shopId), input.categoryId === null || input.categoryId === undefined ? null : Identifier.fromString(input.categoryId), query === "" ? null : query, input.occurredFrom ?? null, input.occurredTo ?? null, status);
  }
}
