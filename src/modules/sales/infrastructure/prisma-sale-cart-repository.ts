import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import type {
  SaleAudit,
  SaleCartRepository,
} from "../application/ports/sale-cart-repository";
import { SaleCart, SaleLine } from "../domain/sale-cart";

export class PrismaSaleCartRepository implements SaleCartRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async create(cart: SaleCart, audit: SaleAudit): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findFirst({
        where: {
          id: cart.shopId.value,
          organizationId: cart.organizationId.value,
          isActive: true,
        },
      });
      if (shop === null)
        throw new DomainError(
          "sales.shop_not_found",
          "The active shop does not belong to this organization.",
        );
      await tx.saleCart.create({
        data: {
          id: cart.id.value,
          organizationId: cart.organizationId.value,
          shopId: cart.shopId.value,
        },
      });
      await tx.organizationAudit.create({
        data: { id: crypto.randomUUID(), ...audit },
      });
    });
  }
  public async find(
    organizationId: string,
    cartId: string,
  ): Promise<SaleCart | null> {
    const row = await this.prisma.saleCart.findFirst({
      where: { id: cartId, organizationId, status: "DRAFT" },
      include: { lines: true },
    });
    if (row === null) return null;
    return SaleCart.draft(
      Identifier.fromString(row.id),
      Identifier.fromString(row.organizationId),
      Identifier.fromString(row.shopId),
      row.lines.map((line) =>
        SaleLine.create({
          id: Identifier.fromString(line.id),
          productId: Identifier.fromString(line.productId),
          productNameSnapshot: line.productNameSnapshot,
          quantity: Quantity.fromNumber(Number(line.quantity)),
          unitPrice: Money.fromMinor(
            Number(line.unitPriceMinor),
            line.currency,
          ),
          unitCost: Money.fromMinor(Number(line.unitCostMinor), line.currency),
          discount: Money.fromMinor(Number(line.discountMinor), line.currency),
        }),
      ),
    );
  }
  public async saveLine(
    organizationId: string,
    cartId: string,
    line: SaleLine,
    audit: SaleAudit,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const cart = await tx.saleCart.findFirst({
        where: { id: cartId, organizationId, status: "DRAFT" },
      });
      if (cart === null)
        throw new DomainError(
          "sales.cart_not_found",
          "The draft cart does not belong to this organization.",
        );
      const product = await tx.product.findFirst({
        where: { id: line.productId.value, organizationId, isActive: true },
      });
      if (product === null)
        throw new DomainError(
          "sales.product_not_found",
          "The product does not belong to this organization.",
        );
      const existing = await tx.saleLine.findUnique({
        where: { id: line.id.value },
        include: { saleCart: true },
      });
      if (
        existing !== null &&
        existing.saleCart.organizationId !== organizationId
      )
        throw new DomainError(
          "sales.line_not_found",
          "The line does not belong to this organization.",
        );
      await tx.saleLine.upsert({
        where: { id: line.id.value },
        create: {
          id: line.id.value,
          saleCartId: cartId,
          productId: line.productId.value,
          productNameSnapshot: line.productNameSnapshot,
          quantity: line.quantity.value,
          unitPriceMinor: BigInt(line.unitPrice.amountMinor),
          unitCostMinor: BigInt(line.unitCost.amountMinor),
          currency: line.unitPrice.currency,
          discountMinor: BigInt(line.discount.amountMinor),
        },
        update: {
          productId: line.productId.value,
          productNameSnapshot: line.productNameSnapshot,
          quantity: line.quantity.value,
          unitPriceMinor: BigInt(line.unitPrice.amountMinor),
          unitCostMinor: BigInt(line.unitCost.amountMinor),
          currency: line.unitPrice.currency,
          discountMinor: BigInt(line.discount.amountMinor),
        },
      });
      await tx.organizationAudit.create({
        data: { id: crypto.randomUUID(), ...audit },
      });
    });
  }
  public async removeLine(
    organizationId: string,
    cartId: string,
    lineId: string,
    audit: SaleAudit,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const line = await tx.saleLine.findFirst({
        where: {
          id: lineId,
          saleCart: { id: cartId, organizationId, status: "DRAFT" },
        },
      });
      if (line === null)
        throw new DomainError(
          "sales.line_not_found",
          "The line does not belong to this draft cart.",
        );
      await tx.saleLine.delete({ where: { id: lineId } });
      await tx.organizationAudit.create({
        data: { id: crypto.randomUUID(), ...audit },
      });
    });
  }
}
