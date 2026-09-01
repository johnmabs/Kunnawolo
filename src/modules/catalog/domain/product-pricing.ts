import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";

export class ProductPricing {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly productId: Identifier,
    public readonly referenceCost: Money,
    public readonly salePrice: Money,
    public readonly reference: string,
    public readonly actorId: string | null,
    public readonly createdAt: Date,
  ) {}

  public static create(input: Readonly<{ id: Identifier; organizationId: Identifier; productId: Identifier; referenceCost: Money; salePrice: Money; reference: string; actorId: string | null; createdAt: Date }>): ProductPricing {
    if (input.referenceCost.amountMinor < 0) throw new DomainError("catalog.invalid_reference_cost", "A reference cost must be non-negative.");
    if (input.salePrice.amountMinor <= 0) throw new DomainError("catalog.invalid_sale_price", "A sale price must be strictly positive.");
    if (input.referenceCost.currency !== input.salePrice.currency) throw new DomainError("catalog.price_currency_mismatch", "Cost and sale price must use the same currency.");
    const reference = input.reference.trim().normalize("NFC");
    if (reference.length === 0) throw new DomainError("catalog.invalid_price_reference", "A price decision reference must be non-empty.");
    return new ProductPricing(input.id, input.organizationId, input.productId, input.referenceCost, input.salePrice, reference, input.actorId, input.createdAt);
  }
}
