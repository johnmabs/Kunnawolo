import type { ExpenseCategory } from "../../domain/expense-category";

export type ExpenseCategoryAudit = Readonly<{
  organizationId: string;
  actorId: string | null;
  action: string;
}>;
export interface ExpenseCategoryRepository {
  save(category: ExpenseCategory, audit: ExpenseCategoryAudit): Promise<void>;
  findById(organizationId: string, id: string): Promise<ExpenseCategory | null>;
}
