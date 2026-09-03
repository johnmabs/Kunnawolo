import type { Product } from "../domain/product";
import type { ProductRepository } from "./ports/product-repository";

export class SearchProducts {
  public constructor(private readonly products: ProductRepository) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      query: string;
      includeInactive?: boolean;
    }>,
  ): Promise<Product[]> {
    return this.products.search(
      input.organizationId,
      input.query.trim().normalize("NFC"),
      input.includeInactive ?? true,
    );
  }
}
