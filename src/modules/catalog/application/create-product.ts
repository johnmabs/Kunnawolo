import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { Product, type ProductDetails } from "../domain/product";
import type { ProductRepository } from "./ports/product-repository";

export class CreateProduct {
  public constructor(
    private readonly products: ProductRepository,
    private readonly ids: IdentifierGenerator,
  ) {}

  public async execute(
    input: ProductDetails &
      Readonly<{ organizationId: string; actorId: string | null }>,
  ): Promise<Product> {
    const product = Product.create(
      this.ids.next(),
      Identifier.fromString(input.organizationId),
      input,
    );
    await this.products.save(product, {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: "product.created",
    });
    return product;
  }
}
