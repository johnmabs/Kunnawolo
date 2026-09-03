import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Product } from "../domain/product";
import type {
  ProductRepository,
  ProductAuditEntry,
} from "./ports/product-repository";
import type { ProductPricingRepository } from "./ports/product-pricing-repository";
import type { ProductPricing } from "../domain/product-pricing";
import { GetCurrentProductPricing } from "./get-current-product-pricing";
import { SetProductPricing } from "./set-product-pricing";

class Products implements ProductRepository {
  public async save(
    _product: Product,
    _audit: ProductAuditEntry,
  ): Promise<void> {}
  public async search(): Promise<Product[]> {
    return [];
  }
  public async findById(
    organizationId: string,
    productId: string,
  ): Promise<Product | null> {
    return organizationId === "org" && productId === "product"
      ? Product.create(
          Identifier.fromString("product"),
          Identifier.fromString("org"),
          { name: "Nsiirin" },
        )
      : null;
  }
}
class Prices implements ProductPricingRepository {
  public current: ProductPricing | null = null;
  public async append(pricing: ProductPricing): Promise<void> {
    this.current = pricing;
  }
  public async findCurrent(): Promise<ProductPricing | null> {
    return this.current;
  }
}

describe("product pricing use cases", () => {
  it("sets and reads an immutable organization-scoped price snapshot", async () => {
    const prices = new Prices();
    const products = new Products();
    const set = new SetProductPricing(
      products,
      prices,
      { next: () => Identifier.fromString("price") },
      { now: () => new Date("2026-09-01T00:00:00.000Z") },
    );
    await set.execute({
      organizationId: "org",
      productId: "product",
      referenceCostMinor: 500,
      salePriceMinor: 800,
      currency: "XOF",
      reference: "  Tarif Ɛ  ",
      actorId: "actor",
    });
    await expect(
      new GetCurrentProductPricing(products, prices).execute({
        organizationId: "org",
        productId: "product",
      }),
    ).resolves.toMatchObject({
      reference: "Tarif Ɛ",
      salePrice: { amountMinor: 800, currency: "XOF" },
    });
    await expect(
      set.execute({
        organizationId: "other",
        productId: "product",
        referenceCostMinor: 500,
        salePriceMinor: 800,
        currency: "XOF",
        reference: "x",
        actorId: "actor",
      }),
    ).rejects.toMatchObject({ code: "catalog.product_not_found" });
  });
});
