import type { ProductPricing } from "../../domain/product-pricing";

export interface ProductPricingRepository {
  append(pricing: ProductPricing): Promise<void>;
  findCurrent(
    organizationId: string,
    productId: string,
  ): Promise<ProductPricing | null>;
}
