import { GetExpenseCategory } from "./get-expense-category";
import type { ExpenseCategoryRepository } from "./ports/expense-category-repository";

export class UpdateExpenseCategory {
  public constructor(private readonly categories: ExpenseCategoryRepository) {}
  public async execute(input: Readonly<{ organizationId: string; categoryId: string; name: string; isActive: boolean; actorId: string | null }>) { const renamed = (await new GetExpenseCategory(this.categories).execute(input)).rename(input.name); const category = input.isActive ? renamed.activate() : renamed.deactivate(); await this.categories.save(category, { organizationId: input.organizationId, actorId: input.actorId, action: "expense_category.updated" }); return category; }
}
