import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type {
  ExpenseCategoryRepository,
  ExpenseCategoryAudit,
} from "../application/ports/expense-category-repository";
import { ExpenseCategory } from "../domain/expense-category";

function toCategory(
  row: Readonly<{
    id: string;
    organizationId: string;
    name: string;
    isActive: boolean;
  }>,
): ExpenseCategory {
  const category = ExpenseCategory.create(
    Identifier.fromString(row.id),
    Identifier.fromString(row.organizationId),
    row.name,
  );
  return row.isActive ? category : category.deactivate();
}
export class PrismaExpenseCategoryRepository implements ExpenseCategoryRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async save(
    category: ExpenseCategory,
    audit: ExpenseCategoryAudit,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.expenseCategory.findUnique({
        where: { id: category.id.value },
      });
      if (
        existing !== null &&
        existing.organizationId !== category.organizationId.value
      )
        throw new DomainError(
          "expenses.category_not_found",
          "The expense category does not belong to this organization.",
        );
      if (
        (await tx.expenseCategory.findFirst({
          where: {
            organizationId: category.organizationId.value,
            name: category.name,
            NOT: { id: category.id.value },
          },
        })) !== null
      )
        throw new DomainError(
          "expenses.duplicate_category_name",
          "An expense category name must be unique in its organization.",
        );
      await tx.expenseCategory.upsert({
        where: { id: category.id.value },
        create: {
          id: category.id.value,
          organizationId: category.organizationId.value,
          name: category.name,
          isActive: category.isActive,
        },
        update: { name: category.name, isActive: category.isActive },
      });
      await tx.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: audit.organizationId,
          actorId: audit.actorId,
          action: audit.action,
        },
      });
    });
  }
  public async findById(
    organizationId: string,
    id: string,
  ): Promise<ExpenseCategory | null> {
    const row = await this.prisma.expenseCategory.findFirst({
      where: { id, organizationId },
    });
    return row === null ? null : toCategory(row);
  }
}
