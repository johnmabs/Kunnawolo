import { DomainError } from "@/shared/domain/domain-error";
import type { Product } from "../domain/product";
import type { ProductRepository } from "./ports/product-repository";

export class GetProduct {
  public constructor(private readonly products: ProductRepository) {}

  public async execute(
    input: Readonly<{ organizationId: string; productId: string }>,
  ): Promise<Product> {
    const product = await this.products.findById(
      input.organizationId,
      input.productId,
    );
    if (product === null)
      throw new DomainError(
        "catalog.product_not_found",
        "The product does not belong to this organization.",
      );
    return product;
  }
}
