import type { ProductDetails } from "../domain/product";
import { GetProduct } from "./get-product";
import type { ProductRepository } from "./ports/product-repository";

export class UpdateProduct {
  public constructor(private readonly products: ProductRepository) {}

  public async execute(
    input: ProductDetails &
      Readonly<{
        organizationId: string;
        productId: string;
        actorId: string | null;
        isActive: boolean;
      }>,
  ) {
    const product = await new GetProduct(this.products).execute(input);
    const revised = product.revise(input);
    const updated = input.isActive ? revised.activate() : revised.deactivate();
    await this.products.save(updated, {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "product.updated",
    });
    return updated;
  }
}
