import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { ProductPricingRepository } from "../application/ports/product-pricing-repository";
import { ProductPricing } from "../domain/product-pricing";

function toPricing(row: Readonly<{ id: string; organizationId: string; productId: string; referenceCostMinor: bigint; salePriceMinor: bigint; currency: string; reference: string; actorId: string | null; createdAt: Date }>): ProductPricing {
  return ProductPricing.create({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), productId: Identifier.fromString(row.productId), referenceCost: Money.fromMinor(Number(row.referenceCostMinor), row.currency), salePrice: Money.fromMinor(Number(row.salePriceMinor), row.currency), reference: row.reference, actorId: row.actorId, createdAt: row.createdAt });
}

export class PrismaProductPricingRepository implements ProductPricingRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async append(pricing: ProductPricing): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({ where: { id: pricing.productId.value, organizationId: pricing.organizationId.value }, select: { id: true } });
      if (product === null) throw new DomainError("catalog.product_not_found", "The product does not belong to this organization.");
      await transaction.productPrice.create({ data: { id: pricing.id.value, organizationId: pricing.organizationId.value, productId: pricing.productId.value, referenceCostMinor: BigInt(pricing.referenceCost.amountMinor), salePriceMinor: BigInt(pricing.salePrice.amountMinor), currency: pricing.salePrice.currency, reference: pricing.reference, actorId: pricing.actorId, createdAt: pricing.createdAt } });
      await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: pricing.organizationId.value, actorId: pricing.actorId, action: "product.pricing_set" } });
    });
  }

  public async findCurrent(organizationId: string, productId: string): Promise<ProductPricing | null> {
    const row = await this.prisma.productPrice.findFirst({ where: { organizationId, productId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
    return row === null ? null : toPricing(row);
  }
}
