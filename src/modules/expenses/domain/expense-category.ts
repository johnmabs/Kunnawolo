import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class ExpenseCategory {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly name: string,
    public readonly isActive: boolean,
  ) {}
  public static create(
    id: Identifier,
    organizationId: Identifier,
    name: string,
  ): ExpenseCategory {
    const normalizedName = name.trim().normalize("NFC");
    if (normalizedName.length === 0)
      throw new DomainError(
        "expenses.invalid_category_name",
        "An expense category name must be non-empty.",
      );
    return new ExpenseCategory(id, organizationId, normalizedName, true);
  }
  public rename(name: string): ExpenseCategory {
    return ExpenseCategory.create(
      this.id,
      this.organizationId,
      name,
    ).withActive(this.isActive);
  }
  public deactivate(): ExpenseCategory {
    return this.withActive(false);
  }
  public activate(): ExpenseCategory {
    return this.withActive(true);
  }
  private withActive(isActive: boolean): ExpenseCategory {
    return new ExpenseCategory(
      this.id,
      this.organizationId,
      this.name,
      isActive,
    );
  }
}
