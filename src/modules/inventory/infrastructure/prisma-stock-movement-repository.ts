import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { StockMovementRepository } from "../application/ports/stock-movement-repository";
import type { StockMovement } from "../domain/stock-movement";

export class PrismaStockMovementRepository implements StockMovementRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async apply(movement: StockMovement): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      if (movement.idempotencyKey !== null && await transaction.stockMovement.findFirst({ where: { organizationId: movement.organizationId.value, idempotencyKey: movement.idempotencyKey } }) !== null) return;
      const level = await transaction.stockLevel.findUnique({ where: { organizationId_shopId_productId: { organizationId: movement.organizationId.value, shopId: movement.shopId.value, productId: movement.productId.value } } });
      if (level === null) throw new DomainError("inventory.stock_level_not_found", "No stock level exists for this shop and product.");
      const nextQuantity = Number(level.quantity.toString()) + movement.quantityDelta;
      if (nextQuantity < 0) throw new DomainError("inventory.insufficient_stock", "A tracked stock level cannot become negative.");
      await transaction.stockLevel.update({ where: { id: level.id }, data: { quantity: nextQuantity } });
      await transaction.stockMovement.create({ data: { id: movement.id.value, organizationId: movement.organizationId.value, shopId: movement.shopId.value, productId: movement.productId.value, quantityDelta: movement.quantityDelta, reason: movement.reason, actorId: movement.actorId, idempotencyKey: movement.idempotencyKey, occurredAt: movement.occurredAt } });
      await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: movement.organizationId.value, actorId: movement.actorId, action: "stock_movement.recorded" } });
    });
  }
}
