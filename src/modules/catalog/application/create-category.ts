import { Identifier } from "@/shared/domain/identifier";
import type { AuditLog } from "@/modules/organization/application/ports/audit-log";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { Category } from "../domain/category";
import type { CategoryRepository } from "./ports/category-repository";
export class CreateCategory {
  public constructor(
    private readonly categories: CategoryRepository,
    private readonly audit: AuditLog,
    private readonly ids: IdentifierGenerator,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      name: string;
      actorId: string | null;
    }>,
  ): Promise<Category> {
    const category = Category.create(
      this.ids.next(),
      Identifier.fromString(input.organizationId),
      input.name,
    );
    await this.categories.save(category);
    await this.audit.record({
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "category.created",
    });
    return category;
  }
}
