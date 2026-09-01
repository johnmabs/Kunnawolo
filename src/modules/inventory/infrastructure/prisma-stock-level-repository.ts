import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import type { StockLevelRepository } from "../application/ports/stock-level-repository";
import { StockLevel } from "../domain/stock-level";

function toStockLevel(row: Readonly<{ id: string; organizationId: string; shopId: string; productId: string; quantity: { toString(): string } }>): StockLevel {
  return StockLevel.reconstitute(Identifier.fromString(row.id), Identifier.fromString(row.organizationId), Identifier.fromString(row.shopId), Identifier.fromString(row.productId), Quantity.fromNumber(Number(row.quantity.toString())));
}

export class PrismaStockLevelRepository implements StockLevelRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async ensure(level: StockLevel, audit: Readonly<{ organizationId: string; actorId: string | null; action: string }>): Promise<StockLevel> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.stockLevel.findUnique({ where: { organizationId_shopId_productId: { organizationId: level.organizationId.value, shopId: level.shopId.value, productId: level.productId.value } } });
      if (existing !== null) return toStockLevel(existing);
      const created = await transaction.stockLevel.create({ data: { id: level.id.value, organizationId: level.organizationId.value, shopId: level.shopId.value, productId: level.productId.value, quantity: level.quantity.value } });
      await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: audit.organizationId, actorId: audit.actorId, action: audit.action } });
      return toStockLevel(created);
    });
  }
  public async find(organizationId: string, shopId: string, productId: string): Promise<StockLevel | null> {
    const row = await this.prisma.stockLevel.findUnique({ where: { organizationId_shopId_productId: { organizationId, shopId, productId } } });
    return row === null ? null : toStockLevel(row);
  }
}
