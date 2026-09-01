import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Product } from "../domain/product";
import { ActivateProduct } from "./activate-product";
import { DeactivateProduct } from "./deactivate-product";
import type { ProductAuditEntry, ProductRepository } from "./ports/product-repository";
import { SearchProducts } from "./search-products";
import { SetProductInventoryTracking } from "./set-product-inventory-tracking";

class Products implements ProductRepository {
  public readonly audits: ProductAuditEntry[] = [];
  public product = Product.create(Identifier.fromString("product"), Identifier.fromString("org"), { name: "Nsiirin Ɛ", code: "KɔD", trackInventory: true });
  public async save(product: Product, audit: ProductAuditEntry): Promise<void> { this.product = product; this.audits.push(audit); }
  public async findById(organizationId: string, productId: string): Promise<Product | null> { return organizationId === "org" && productId === "product" ? this.product : null; }
  public async search(organizationId: string, query: string, includeInactive: boolean): Promise<Product[]> { return organizationId === "org" && (includeInactive || this.product.isActive) && [this.product.name, this.product.code ?? "", this.product.barcode ?? ""].some((value) => value.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ? [this.product] : []; }
}

describe("product lifecycle use cases", () => {
  it("deactivates, reactivates and changes inventory tracking without changing organization", async () => {
    const products = new Products();
    await new DeactivateProduct(products).execute({ organizationId: "org", productId: "product", actorId: "actor-1" });
    await expect(new SearchProducts(products).execute({ organizationId: "org", query: "nsiirin", includeInactive: false })).resolves.toEqual([]);
    await new SetProductInventoryTracking(products).execute({ organizationId: "org", productId: "product", trackInventory: false, actorId: "actor-2" });
    await new ActivateProduct(products).execute({ organizationId: "org", productId: "product", actorId: "actor-3" });
    await expect(new SearchProducts(products).execute({ organizationId: "org", query: "kɔd" })).resolves.toMatchObject([{ organizationId: { value: "org" }, isActive: true, trackInventory: false }]);
    expect(products.audits.map(({ action }) => action)).toEqual(["product.deactivated", "product.inventory_tracking_changed", "product.activated"]);
  });
});
