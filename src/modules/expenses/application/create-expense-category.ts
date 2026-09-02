import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { ExpenseCategory } from "../domain/expense-category";
import type { ExpenseCategoryRepository } from "./ports/expense-category-repository";

export class CreateExpenseCategory {
  public constructor(private readonly categories: ExpenseCategoryRepository, private readonly ids: IdentifierGenerator) {}
  public async execute(input: Readonly<{ organizationId: string; name: string; actorId: string | null }>): Promise<ExpenseCategory> { const category = ExpenseCategory.create(this.ids.next(), Identifier.fromString(input.organizationId), input.name); await this.categories.save(category, { organizationId: input.organizationId, actorId: input.actorId, action: "expense_category.created" }); return category; }
}
