import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { GetProduct } from "@/modules/catalog/application/get-product";
import { GetCurrentProductPricing } from "@/modules/catalog/application/get-current-product-pricing";
import { PrismaProductPricingRepository } from "@/modules/catalog/infrastructure/prisma-product-pricing-repository";
import { PrismaProductRepository } from "@/modules/catalog/infrastructure/prisma-product-repository";
import { GetStockLevel } from "@/modules/inventory/application/get-stock-level";
import { PrismaStockLevelRepository } from "@/modules/inventory/infrastructure/prisma-stock-level-repository";

export async function getStockDetail(prisma: PrismaClient, organizationId: string, shopId: string, productId: string) {
  const products = new PrismaProductRepository(prisma);
  const [product, level, pricing] = await Promise.all([
    new GetProduct(products).execute({ organizationId, productId }),
    new GetStockLevel(new PrismaStockLevelRepository(prisma)).execute({ organizationId, shopId, productId }),
    new GetCurrentProductPricing(products, new PrismaProductPricingRepository(prisma)).execute({ organizationId, productId }),
  ]);
  return {
    currency: pricing.referenceCost.currency,
    isLowStock: level.isLowStock(),
    lowStockThreshold: level.lowStockThreshold.value,
    productCode: product.code,
    productId: product.id.value,
    productName: product.name,
    quantity: level.quantity.value,
    referenceCostMinor: pricing.referenceCost.amountMinor,
  };
}
