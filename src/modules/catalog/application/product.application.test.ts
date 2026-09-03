import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { CreateProduct } from "./create-product";
import { GetProduct } from "./get-product";
import type {
  ProductAuditEntry,
  ProductRepository,
} from "./ports/product-repository";
import { SearchProducts } from "./search-products";
import { UpdateProduct } from "./update-product";
import type { Product } from "../domain/product";

class MemoryProducts implements ProductRepository {
  public readonly audits: ProductAuditEntry[] = [];
  private readonly products = new Map<string, Product>();
  public async save(product: Product, audit: ProductAuditEntry): Promise<void> {
    this.products.set(product.id.value, product);
    this.audits.push(audit);
  }
  public async findById(
    organizationId: string,
    id: string,
  ): Promise<Product | null> {
    const product = this.products.get(id);
    return product?.organizationId.value === organizationId ? product : null;
  }
  public async search(
    organizationId: string,
    query: string,
  ): Promise<Product[]> {
    return [...this.products.values()].filter(
      (product) =>
        product.organizationId.value === organizationId &&
        product.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    );
  }
}

describe("product use cases", () => {
  it("creates, reads, updates and searches an NFC Unicode product inside its organization", async () => {
    const products = new MemoryProducts();
    const create = new CreateProduct(products, {
      next: () => Identifier.fromString("product-1"),
    });
    await create.execute({
      organizationId: "org-1",
      actorId: "actor-1",
      name: "  Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ  ",
      code: "NSI-1",
      packaging: "Sàc",
      form: "Pɔ́dɔrɔ",
    });
    const read = await new GetProduct(products).execute({
      organizationId: "org-1",
      productId: "product-1",
    });
    await new UpdateProduct(products).execute({
      organizationId: "org-1",
      productId: "product-1",
      actorId: "actor-2",
      name: read.name,
      code: "NSI-2",
      barcode: "001",
      packaging: "Sàc",
      form: "Pɔ́dɔrɔ",
      isActive: false,
    });
    await expect(
      new SearchProducts(products).execute({
        organizationId: "org-1",
        query: "nsiirin",
      }),
    ).resolves.toMatchObject([
      { name: "Nsiirin Ɛ Ɔ ɲ ŋ Fɔ́lɔ".normalize("NFC"), isActive: false },
    ]);
    await expect(
      new GetProduct(products).execute({
        organizationId: "org-2",
        productId: "product-1",
      }),
    ).rejects.toMatchObject({ code: "catalog.product_not_found" });
    expect(products.audits).toMatchObject([
      { action: "product.created", actorId: "actor-1" },
      { action: "product.updated", actorId: "actor-2" },
    ]);
  });
});
