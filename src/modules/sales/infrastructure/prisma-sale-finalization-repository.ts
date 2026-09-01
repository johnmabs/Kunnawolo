import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import type { SaleFinalizationRepository } from "../application/ports/sale-finalization-repository";
import { SaleFinalization, SaleLine } from "../domain/sale-cart";

type FinalizedCartRow = Readonly<{ id: string; organizationId: string; shopId: string; finalizationReference: string | null; finalizedByActorId: string | null; finalizedAt: Date | null; underCostReason: string | null; lines: ReadonlyArray<{ id: string; productId: string; productNameSnapshot: string; quantity: { toString(): string }; unitPriceMinor: bigint; unitCostMinor: bigint; currency: string; discountMinor: bigint }> }>;

function toFinalization(row: FinalizedCartRow): SaleFinalization {
  if (row.finalizationReference === null || row.finalizedAt === null) throw new DomainError("sales.invalid_finalization_state", "Finalization metadata is incomplete.");
  const lines = row.lines.map((line) => SaleLine.create({ id: Identifier.fromString(line.id), productId: Identifier.fromString(line.productId), productNameSnapshot: line.productNameSnapshot, quantity: Quantity.fromNumber(Number(line.quantity.toString())), unitPrice: Money.fromMinor(Number(line.unitPriceMinor), line.currency), unitCost: Money.fromMinor(Number(line.unitCostMinor), line.currency), discount: Money.fromMinor(Number(line.discountMinor), line.currency) }));
  return SaleFinalization.create(Identifier.fromString(row.id), Identifier.fromString(row.organizationId), Identifier.fromString(row.shopId), lines, row.finalizationReference, row.finalizedByActorId, row.finalizedAt, row.underCostReason);
}

export class PrismaSaleFinalizationRepository implements SaleFinalizationRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByReference(organizationId: string, reference: string): Promise<SaleFinalization | null> {
    const row = await this.prisma.saleCart.findFirst({ where: { organizationId, finalizationReference: reference, status: "FINALIZED" }, include: { lines: true } });
    return row === null ? null : toFinalization(row);
  }

  public async findByCartId(organizationId: string, cartId: string): Promise<SaleFinalization | null> {
    const row = await this.prisma.saleCart.findFirst({ where: { id: cartId, organizationId, status: { in: ["FINALIZED", "PAID"] } }, include: { lines: true } });
    return row === null ? null : toFinalization(row);
  }

  public async commit(finalization: SaleFinalization): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const reserved = await transaction.saleCart.updateMany({ where: { id: finalization.cartId.value, organizationId: finalization.organizationId.value, status: "DRAFT" }, data: { status: "FINALIZING", finalizationReference: finalization.reference, finalizedByActorId: finalization.actorId, finalizedAt: finalization.finalizedAt, underCostReason: finalization.underCostReason } });
      if (reserved.count !== 1) {
        const current = await transaction.saleCart.findFirst({ where: { id: finalization.cartId.value, organizationId: finalization.organizationId.value } });
        if (current?.status === "FINALIZED" && current.finalizationReference === finalization.reference) return;
        throw new DomainError("sales.cart_not_found", "The draft cart cannot be finalized in this organization.");
      }

      const cart = await transaction.saleCart.findUnique({ where: { id: finalization.cartId.value }, include: { lines: true } });
      if (cart === null || cart.lines.length === 0) throw new DomainError("sales.empty_cart", "An empty cart cannot be finalized.");
      for (const line of cart.lines) {
        const product = await transaction.product.findFirst({ where: { id: line.productId, organizationId: finalization.organizationId.value }, select: { trackInventory: true } });
        if (product === null) throw new DomainError("sales.product_not_found", "A sale product does not belong to this organization.");
        if (!product.trackInventory) continue;
        const changed = await transaction.stockLevel.updateMany({ where: { organizationId: finalization.organizationId.value, shopId: finalization.shopId.value, productId: line.productId, quantity: { gte: line.quantity } }, data: { quantity: { decrement: line.quantity } } });
        if (changed.count !== 1) throw new DomainError("sales.insufficient_stock", "Available stock is insufficient to finalize the sale.");
        await transaction.stockMovement.create({ data: { id: crypto.randomUUID(), organizationId: finalization.organizationId.value, shopId: finalization.shopId.value, productId: line.productId, quantityDelta: line.quantity.negated(), reason: `sale.finalized:${finalization.reference}`, actorId: finalization.actorId, idempotencyKey: `sale:${finalization.cartId.value}:${line.id}`, occurredAt: finalization.finalizedAt } });
      }
      await transaction.saleCart.update({ where: { id: finalization.cartId.value }, data: { status: "FINALIZED" } });
      await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: finalization.organizationId.value, actorId: finalization.actorId, action: "sale.finalized" } });
    });
  }
}
