import { GetProduct } from "./get-product";
import type { ProductRepository } from "./ports/product-repository";

export class ActivateProduct {
  public constructor(private readonly products: ProductRepository) {}
  public async execute(input: Readonly<{ organizationId: string; productId: string; actorId: string | null }>) {
    const product = (await new GetProduct(this.products).execute(input)).activate();
    await this.products.save(product, { organizationId: input.organizationId, actorId: input.actorId, action: "product.activated" });
    return product;
  }
}
