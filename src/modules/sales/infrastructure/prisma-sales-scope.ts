import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { SalesScope } from "../application/ports/sales-scope";
export class PrismaSalesScope implements SalesScope {
  public constructor(private readonly prisma: PrismaClient) {}
  public async activeShopBelongsToOrganization(
    organizationId: string,
    shopId: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.shop.count({
        where: { id: shopId, organizationId, isActive: true },
      })) === 1
    );
  }
  public async findActiveProductSnapshot(
    organizationId: string,
    productId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId, isActive: true },
      include: {
        prices: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1 },
      },
    });
    const price = product?.prices[0];
    if (product === null || price === undefined) return null;
    return {
      name: product.name,
      unitPriceMinor: Number(price.salePriceMinor),
      unitCostMinor: Number(price.referenceCostMinor),
      currency: price.currency,
    };
  }
}
