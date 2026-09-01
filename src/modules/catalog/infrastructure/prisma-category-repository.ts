import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { Identifier } from "@/shared/domain/identifier";
import type { CategoryRepository } from "../application/ports/category-repository";
import { Category } from "../domain/category";
export class PrismaCategoryRepository implements CategoryRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async save(category: Category): Promise<void> { await this.prisma.category.upsert({ where: { id: category.id.value }, create: { id: category.id.value, organizationId: category.organizationId.value, name: category.name, isActive: category.isActive }, update: { name: category.name, isActive: category.isActive } }); }
  public async findById(id: string): Promise<Category | null> { const row = await this.prisma.category.findUnique({ where: { id } }); if (row === null) return null; const category = Category.create(Identifier.fromString(row.id), Identifier.fromString(row.organizationId), row.name); return row.isActive ? category : category.deactivate(); }
}
