import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { InventoryReconciliationRepository } from "../application/ports/inventory-reconciliation-repository";
import type {
  InventoryReconciliation,
  InventoryReconciliationSnapshot,
} from "../domain/inventory-reconciliation";

export class PrismaInventoryReconciliationRepository implements InventoryReconciliationRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async findSnapshots(
    organizationId: string,
    shopId: string,
  ): Promise<readonly InventoryReconciliationSnapshot[]> {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, organizationId },
    });
    if (shop === null)
      throw new DomainError(
        "inventory.shop_not_found",
        "The shop does not belong to this organization.",
      );
    const [levels, movements] = await Promise.all([
      this.prisma.stockLevel.findMany({ where: { organizationId, shopId } }),
      this.prisma.stockMovement.groupBy({
        by: ["productId"],
        where: { organizationId, shopId },
        _sum: { quantityDelta: true },
      }),
    ]);
    const ledgerByProduct = new Map(
      movements.map((movement) => [
        movement.productId,
        Number(movement._sum.quantityDelta ?? 0),
      ]),
    );
    return levels.map((level) => ({
      productId: Identifier.fromString(level.productId),
      stockLevelId: Identifier.fromString(level.id),
      stockLevelQuantity: Number(level.quantity),
      ledgerQuantity: ledgerByProduct.get(level.productId) ?? 0,
    }));
  }
  public async save(reconciliation: InventoryReconciliation): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryReconciliation.findFirst({
        where: {
          organizationId: reconciliation.organizationId.value,
          reference: reconciliation.reference,
        },
      });
      if (existing !== null) return;
      const shop = await tx.shop.findFirst({
        where: {
          id: reconciliation.shopId.value,
          organizationId: reconciliation.organizationId.value,
        },
      });
      if (shop === null)
        throw new DomainError(
          "inventory.shop_not_found",
          "The shop does not belong to this organization.",
        );
      await tx.inventoryReconciliation.create({
        data: {
          id: reconciliation.id.value,
          organizationId: reconciliation.organizationId.value,
          shopId: reconciliation.shopId.value,
          reference: reconciliation.reference,
          actorId: reconciliation.actorId,
          reconciledAt: reconciliation.reconciledAt,
          lines: {
            create: reconciliation.lines.map((line) => ({
              id: line.id.value,
              productId: line.productId.value,
              stockLevelId: line.stockLevelId.value,
              stockLevelQuantity: line.stockLevelQuantity,
              ledgerQuantity: line.ledgerQuantity,
              quantityDifference: line.quantityDifference,
            })),
          },
        },
      });
      await tx.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: reconciliation.organizationId.value,
          actorId: reconciliation.actorId,
          action: `inventory_reconciliation.completed:${reconciliation.id.value}:${reconciliation.reference}`,
        },
      });
    });
  }
}
