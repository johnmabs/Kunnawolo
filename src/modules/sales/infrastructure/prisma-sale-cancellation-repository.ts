import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { SaleCancellationRepository } from "../application/ports/sale-cancellation-repository";
import { SaleCancellation } from "../domain/sale-cancellation";

function toCancellation(
  row: Readonly<{
    id: string;
    organizationId: string;
    saleCartId: string;
    cancellationReference: string;
    reason: string;
    actorId: string | null;
    cancelledAt: Date;
  }>,
): SaleCancellation {
  return SaleCancellation.create({
    id: Identifier.fromString(row.id),
    organizationId: Identifier.fromString(row.organizationId),
    cartId: Identifier.fromString(row.saleCartId),
    reference: row.cancellationReference,
    reason: row.reason,
    actorId: row.actorId,
    cancelledAt: row.cancelledAt,
  });
}
export class PrismaSaleCancellationRepository implements SaleCancellationRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async findByReference(
    organizationId: string,
    reference: string,
  ): Promise<SaleCancellation | null> {
    const row = await this.prisma.saleCancellation.findFirst({
      where: { organizationId, cancellationReference: reference },
    });
    return row === null ? null : toCancellation(row);
  }
  public async commit(cancellation: SaleCancellation): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const byReference = await tx.saleCancellation.findFirst({
        where: {
          organizationId: cancellation.organizationId.value,
          cancellationReference: cancellation.reference,
        },
      });
      if (byReference !== null) {
        if (byReference.saleCartId === cancellation.cartId.value) return;
        throw new DomainError(
          "sales.cancellation_reference_taken",
          "The cancellation reference is already used.",
        );
      }
      const reserved = await tx.saleCart.updateMany({
        where: {
          id: cancellation.cartId.value,
          organizationId: cancellation.organizationId.value,
          status: { in: ["FINALIZED", "PAID"] },
        },
        data: { status: "CANCELLING" },
      });
      if (reserved.count !== 1)
        throw new DomainError(
          "sales.sale_not_finalized",
          "The sale cannot be cancelled in this organization.",
        );
      const cart = await tx.saleCart.findUnique({
        where: { id: cancellation.cartId.value },
        include: { lines: true },
      });
      if (cart === null)
        throw new DomainError(
          "sales.sale_not_finalized",
          "The sale cannot be cancelled.",
        );
      for (const line of cart.lines) {
        const product = await tx.product.findFirst({
          where: {
            id: line.productId,
            organizationId: cancellation.organizationId.value,
          },
          select: { trackInventory: true },
        });
        if (product === null)
          throw new DomainError(
            "sales.product_not_found",
            "A sale product does not belong to this organization.",
          );
        if (!product.trackInventory) continue;
        const restored = await tx.stockLevel.updateMany({
          where: {
            organizationId: cancellation.organizationId.value,
            shopId: cart.shopId,
            productId: line.productId,
          },
          data: { quantity: { increment: line.quantity } },
        });
        if (restored.count !== 1)
          throw new DomainError(
            "sales.stock_level_not_found",
            "The stock level cannot be restored.",
          );
        await tx.stockMovement.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: cancellation.organizationId.value,
            shopId: cart.shopId,
            productId: line.productId,
            quantityDelta: line.quantity,
            reason: `sale.cancelled:${cancellation.reference}`,
            actorId: cancellation.actorId,
            idempotencyKey: `sale-cancellation:${cancellation.cartId.value}:${line.id}`,
            occurredAt: cancellation.cancelledAt,
          },
        });
      }
      await tx.salePayment.updateMany({
        where: { saleCartId: cancellation.cartId.value },
        data: { status: "CANCELLED" },
      });
      await tx.saleCancellation.create({
        data: {
          id: cancellation.id.value,
          organizationId: cancellation.organizationId.value,
          saleCartId: cancellation.cartId.value,
          cancellationReference: cancellation.reference,
          reason: cancellation.reason,
          actorId: cancellation.actorId,
          cancelledAt: cancellation.cancelledAt,
        },
      });
      await tx.saleCart.update({
        where: { id: cancellation.cartId.value },
        data: { status: "CANCELLED" },
      });
      await tx.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: cancellation.organizationId.value,
          actorId: cancellation.actorId,
          action: "sale.cancelled",
        },
      });
    });
  }
}
