import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { ProductPricing } from "../domain/product-pricing";
import { GetProduct } from "./get-product";
import type { ProductRepository } from "./ports/product-repository";
import type { ProductPricingRepository } from "./ports/product-pricing-repository";

export class SetProductPricing {
  public constructor(private readonly products: ProductRepository, private readonly prices: ProductPricingRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {}

  public async execute(input: Readonly<{ organizationId: string; productId: string; referenceCostMinor: number; salePriceMinor: number; currency: string; reference: string; actorId: string | null }>): Promise<ProductPricing> {
    await new GetProduct(this.products).execute(input);
    const pricing = ProductPricing.create({ id: this.ids.next(), organizationId: Identifier.fromString(input.organizationId), productId: Identifier.fromString(input.productId), referenceCost: Money.fromMinor(input.referenceCostMinor, input.currency), salePrice: Money.fromMinor(input.salePriceMinor, input.currency), reference: input.reference, actorId: input.actorId, createdAt: this.clock.now() });
    await this.prices.append(pricing);
    return pricing;
  }
}
