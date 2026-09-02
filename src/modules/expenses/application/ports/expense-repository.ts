import type { Expense } from "../../domain/expense";

export interface ExpenseRepository {
  findByReference(organizationId: string, reference: string): Promise<Expense | null>;
  record(expense: Expense): Promise<Expense>;
}
