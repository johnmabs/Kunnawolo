import { DomainError } from "@/shared/domain/domain-error";
import type { ExpenseCategoryRepository } from "./ports/expense-category-repository";

export class GetExpenseCategory {
  public constructor(private readonly categories: ExpenseCategoryRepository) {}
  public async execute(input: Readonly<{ organizationId: string; categoryId: string }>) { const category = await this.categories.findById(input.organizationId, input.categoryId); if (category === null) throw new DomainError("expenses.category_not_found", "The expense category does not belong to this organization."); return category; }
}
