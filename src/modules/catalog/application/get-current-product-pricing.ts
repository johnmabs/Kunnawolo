import { DomainError } from "@/shared/domain/domain-error";
import { GetProduct } from "./get-product";
import type { ProductRepository } from "./ports/product-repository";
import type { ProductPricingRepository } from "./ports/product-pricing-repository";

export class GetCurrentProductPricing {
  public constructor(private readonly products: ProductRepository, private readonly prices: ProductPricingRepository) {}

  public async execute(input: Readonly<{ organizationId: string; productId: string }>) {
    await new GetProduct(this.products).execute(input);
    const pricing = await this.prices.findCurrent(input.organizationId, input.productId);
    if (pricing === null) throw new DomainError("catalog.product_pricing_not_found", "The product has no current pricing.");
    return pricing;
  }
}
