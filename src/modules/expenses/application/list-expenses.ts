import { ExpenseConsultationFilter } from "../domain/expense-consultation-filter";
import type { ExpenseConsultationRepository, ExpenseListItem } from "./ports/expense-consultation-repository";
import type { ExpenseReadAuthorization } from "./ports/expense-read-authorization";

export class ListExpenses {
  public constructor(private readonly expenses: ExpenseConsultationRepository, private readonly authorization: ExpenseReadAuthorization) {}

  public async execute(input: Readonly<{ organizationId: string; actorId: string | null; shopId?: string | null; categoryId?: string | null; query?: string | null; occurredFrom?: Date | null; occurredTo?: Date | null; status?: string | null }>): Promise<readonly ExpenseListItem[]> {
    const filter = ExpenseConsultationFilter.create(input);
    const scope = await this.authorization.authorize(input.organizationId, filter.shopId?.value ?? null, input.actorId);
    return this.expenses.list(input.organizationId, filter, scope);
  }
}
