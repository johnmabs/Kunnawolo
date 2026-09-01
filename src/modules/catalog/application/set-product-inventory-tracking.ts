import { GetProduct } from "./get-product";
import type { ProductRepository } from "./ports/product-repository";

export class SetProductInventoryTracking {
  public constructor(private readonly products: ProductRepository) {}
  public async execute(input: Readonly<{ organizationId: string; productId: string; trackInventory: boolean; actorId: string | null }>) {
    const product = (await new GetProduct(this.products).execute(input)).changeInventoryTracking(input.trackInventory);
    await this.products.save(product, { organizationId: input.organizationId, actorId: input.actorId, action: "product.inventory_tracking_changed" });
    return product;
  }
}
