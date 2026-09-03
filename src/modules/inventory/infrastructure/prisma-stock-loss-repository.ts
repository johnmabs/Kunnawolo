import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { StockLossRepository } from "../application/ports/stock-loss-repository";
import type { StockLoss } from "../domain/stock-loss";
export class PrismaStockLossRepository implements StockLossRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async record(loss: StockLoss): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: loss.productId.value,
          organizationId: loss.organizationId.value,
          trackInventory: true,
        },
      });
      if (product === null)
        throw new DomainError(
          "inventory.product_not_found",
          "The tracked product does not belong to this organization.",
        );
      const updated = await tx.stockLevel.updateMany({
        where: {
          organizationId: loss.organizationId.value,
          shopId: loss.shopId.value,
          productId: loss.productId.value,
          quantity: { gte: loss.quantity.value },
        },
        data: { quantity: { decrement: loss.quantity.value } },
      });
      if (updated.count !== 1)
        throw new DomainError(
          "inventory.insufficient_stock",
          "The tracked stock is insufficient for this loss.",
        );
      await tx.stockLoss.create({
        data: {
          id: loss.id.value,
          organizationId: loss.organizationId.value,
          shopId: loss.shopId.value,
          productId: loss.productId.value,
          quantity: loss.quantity.value,
          reason: loss.reason,
          referenceCostMinor: BigInt(loss.referenceCost.amountMinor),
          currency: loss.referenceCost.currency,
          actorId: loss.actorId,
          occurredAt: loss.occurredAt,
        },
      });
      await tx.stockMovement.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: loss.organizationId.value,
          shopId: loss.shopId.value,
          productId: loss.productId.value,
          quantityDelta: -loss.quantity.value,
          reason: `stock.loss:${loss.reason}`,
          actorId: loss.actorId,
          idempotencyKey: `stock-loss:${loss.id.value}`,
          occurredAt: loss.occurredAt,
        },
      });
      await tx.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: loss.organizationId.value,
          actorId: loss.actorId,
          action: `stock_loss.recorded:${loss.id.value}`,
        },
      });
    });
  }
}
