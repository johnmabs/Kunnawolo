import type { ExpenseCancellation } from "../../domain/expense-cancellation";
import type { ExpenseConsultationFilter } from "../../domain/expense-consultation-filter";
import type { Expense } from "../../domain/expense";
import type { ExpenseReadScope } from "./expense-read-authorization";

export type ExpenseListItem = Readonly<{
  expense: Expense;
  categoryName: string;
  cancellation: ExpenseCancellation | null;
}>;

export interface ExpenseConsultationRepository {
  list(
    organizationId: string,
    filter: ExpenseConsultationFilter,
    scope: ExpenseReadScope,
  ): Promise<readonly ExpenseListItem[]>;
}
