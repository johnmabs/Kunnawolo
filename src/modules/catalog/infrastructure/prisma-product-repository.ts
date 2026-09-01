import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { ProductRepository, ProductAuditEntry } from "../application/ports/product-repository";
import { Product } from "../domain/product";

type UniqueConstraintError = { code?: unknown; meta?: { target?: unknown } };

function uniqueError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as UniqueConstraintError;
  return candidate.code === "P2002";
}

function toProduct(row: Readonly<{ id: string; organizationId: string; name: string; code: string | null; barcode: string | null; packaging: string | null; form: string | null; isActive: boolean; trackInventory: boolean }>): Product {
  const product = Product.create(Identifier.fromString(row.id), Identifier.fromString(row.organizationId), row);
  return row.isActive ? product : product.deactivate();
}

export class PrismaProductRepository implements ProductRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async save(product: Product, audit: ProductAuditEntry): Promise<void> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.product.findUnique({ where: { id: product.id.value }, select: { organizationId: true } });
        if (existing !== null && existing.organizationId !== product.organizationId.value) {
          throw new DomainError("catalog.product_not_found", "The product does not belong to this organization.");
        }
        await transaction.product.upsert({
          where: { id: product.id.value },
          create: { id: product.id.value, organizationId: product.organizationId.value, name: product.name, code: product.code, barcode: product.barcode, packaging: product.packaging, form: product.form, isActive: product.isActive, trackInventory: product.trackInventory },
          update: { name: product.name, code: product.code, barcode: product.barcode, packaging: product.packaging, form: product.form, isActive: product.isActive, trackInventory: product.trackInventory },
        });
        await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: audit.organizationId, actorId: audit.actorId, action: audit.action } });
      });
    } catch (error) {
      if (uniqueError(error)) {
        if (product.code !== null && await this.prisma.product.findFirst({ where: { organizationId: product.organizationId.value, code: product.code, NOT: { id: product.id.value } } }) !== null) throw new DomainError("catalog.product_code_taken", "A product code must be unique within an organization.");
        if (product.barcode !== null && await this.prisma.product.findFirst({ where: { organizationId: product.organizationId.value, barcode: product.barcode, NOT: { id: product.id.value } } }) !== null) throw new DomainError("catalog.product_barcode_taken", "A product barcode must be unique within an organization.");
      }
      throw error;
    }
  }

  public async findById(organizationId: string, id: string): Promise<Product | null> {
    const row = await this.prisma.product.findFirst({ where: { id, organizationId } });
    return row === null ? null : toProduct(row);
  }

  public async search(organizationId: string, query: string, includeInactive: boolean): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { organizationId, ...(includeInactive ? {} : { isActive: true }), ...(query.length === 0 ? {} : { OR: [{ name: { contains: query, mode: "insensitive" } }, { code: { contains: query, mode: "insensitive" } }, { barcode: { contains: query, mode: "insensitive" } }] }) },
      orderBy: { name: "asc" },
    });
    return rows.map(toProduct);
  }
}
