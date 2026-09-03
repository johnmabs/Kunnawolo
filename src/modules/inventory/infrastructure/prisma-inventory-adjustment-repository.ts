import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type { InventoryAdjustmentRepository } from "../application/ports/inventory-adjustment-repository";
import type { InventoryAdjustment } from "../domain/inventory-adjustment";

export class PrismaInventoryAdjustmentRepository implements InventoryAdjustmentRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async apply(adjustment: InventoryAdjustment): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryAdjustment.findFirst({
        where: {
          organizationId: adjustment.organizationId.value,
          inventorySessionId: adjustment.sessionId.value,
        },
      });
      if (existing !== null) {
        if (existing.reference === adjustment.reference) return;
        throw new DomainError(
          "inventory.session_already_adjusted",
          "This inventory session has already been adjusted.",
        );
      }
      if (
        (await tx.inventoryAdjustment.findFirst({
          where: {
            organizationId: adjustment.organizationId.value,
            reference: adjustment.reference,
          },
        })) !== null
      )
        throw new DomainError(
          "inventory.adjustment_reference_conflict",
          "This adjustment reference is already in use.",
        );
      const session = await tx.inventorySession.findFirst({
        where: {
          id: adjustment.sessionId.value,
          organizationId: adjustment.organizationId.value,
          shopId: adjustment.shopId.value,
          status: "CLOSED",
        },
      });
      if (session === null)
        throw new DomainError(
          "inventory.closed_session_not_found",
          "A closed inventory session is required for an adjustment.",
        );
      for (const line of adjustment.lines) {
        const product = await tx.product.findFirst({
          where: {
            id: line.productId.value,
            organizationId: adjustment.organizationId.value,
            trackInventory: true,
          },
        });
        if (product === null)
          throw new DomainError(
            "inventory.product_not_found",
            "The tracked product does not belong to this organization.",
          );
        const level = await tx.stockLevel.findUnique({
          where: {
            organizationId_shopId_productId: {
              organizationId: adjustment.organizationId.value,
              shopId: adjustment.shopId.value,
              productId: line.productId.value,
            },
          },
        });
        if (level === null)
          throw new DomainError(
            "inventory.stock_level_not_found",
            "No stock level exists for this shop and product.",
          );
        const updated =
          line.quantityDelta < 0
            ? await tx.stockLevel.updateMany({
                where: { id: level.id, quantity: { gte: -line.quantityDelta } },
                data: { quantity: { decrement: -line.quantityDelta } },
              })
            : await tx.stockLevel.updateMany({
                where: { id: level.id },
                data: { quantity: { increment: line.quantityDelta } },
              });
        if (updated.count !== 1)
          throw new DomainError(
            "inventory.insufficient_stock",
            "A tracked stock level cannot become negative.",
          );
      }
      await tx.stockMovement.createMany({
        data: adjustment.lines.map((line) => ({
          id: line.stockMovementId.value,
          organizationId: adjustment.organizationId.value,
          shopId: adjustment.shopId.value,
          productId: line.productId.value,
          quantityDelta: line.quantityDelta,
          reason: `inventory.adjustment:${adjustment.reference}`,
          actorId: adjustment.actorId,
          idempotencyKey: `inventory-adjustment:${adjustment.id.value}:${line.id.value}`,
          occurredAt: adjustment.adjustedAt,
        })),
      });
      await tx.inventoryAdjustment.create({
        data: {
          id: adjustment.id.value,
          organizationId: adjustment.organizationId.value,
          inventorySessionId: adjustment.sessionId.value,
          shopId: adjustment.shopId.value,
          reference: adjustment.reference,
          actorId: adjustment.actorId,
          adjustedAt: adjustment.adjustedAt,
          lines: {
            create: adjustment.lines.map((line) => ({
              id: line.id.value,
              productId: line.productId.value,
              expectedQuantity: line.expectedQuantity.value,
              countedQuantity: line.countedQuantity.value,
              quantityDelta: line.quantityDelta,
              stockMovementId: line.stockMovementId.value,
            })),
          },
        },
      });
      await tx.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: adjustment.organizationId.value,
          actorId: adjustment.actorId,
          action: `inventory_adjustment.applied:${adjustment.id.value}:${adjustment.reference}`,
        },
      });
    });
  }
}
