import { DomainError } from "@/shared/domain/domain-error";
import type { SaleCartRepository } from "./ports/sale-cart-repository";
export class GetSaleCart {
  public constructor(private readonly carts: SaleCartRepository) {}
  public async execute(
    input: Readonly<{ organizationId: string; cartId: string }>,
  ) {
    const cart = await this.carts.find(input.organizationId, input.cartId);
    if (cart === null)
      throw new DomainError(
        "sales.cart_not_found",
        "The draft cart does not belong to this organization.",
      );
    return cart;
  }
}
