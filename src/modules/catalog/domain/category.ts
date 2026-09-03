import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class Category {
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
  ): Category {
    const normalized = name.trim().normalize("NFC");
    if (normalized.length === 0)
      throw new DomainError(
        "catalog.invalid_category_name",
        "A category name must be non-empty.",
      );
    return new Category(id, organizationId, normalized, true);
  }
  public rename(name: string): Category {
    return Category.create(this.id, this.organizationId, name);
  }
  public deactivate(): Category {
    return new Category(this.id, this.organizationId, this.name, false);
  }
}
