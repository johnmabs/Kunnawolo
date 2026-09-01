import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type ProductDetails = Readonly<{
  name: string;
  code?: string | null;
  barcode?: string | null;
  packaging?: string | null;
  form?: string | null;
  trackInventory?: boolean;
}>;

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim().normalize("NFC");
  return normalized.length === 0 ? null : normalized;
}

export class Product {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly name: string,
    public readonly code: string | null,
    public readonly barcode: string | null,
    public readonly packaging: string | null,
    public readonly form: string | null,
    public readonly isActive: boolean,
    public readonly trackInventory: boolean,
  ) {}

  public static create(id: Identifier, organizationId: Identifier, details: ProductDetails): Product {
    const name = details.name.trim().normalize("NFC");
    if (name.length === 0) throw new DomainError("catalog.invalid_product_name", "A product name must be non-empty.");
    return new Product(id, organizationId, name, normalizeOptional(details.code), normalizeOptional(details.barcode), normalizeOptional(details.packaging), normalizeOptional(details.form), true, details.trackInventory ?? true);
  }

  public revise(details: ProductDetails): Product {
    const revised = Product.create(this.id, this.organizationId, { ...details, trackInventory: details.trackInventory ?? this.trackInventory });
    return this.isActive ? revised : revised.deactivate();
  }

  public activate(): Product { return new Product(this.id, this.organizationId, this.name, this.code, this.barcode, this.packaging, this.form, true, this.trackInventory); }
  public deactivate(): Product { return new Product(this.id, this.organizationId, this.name, this.code, this.barcode, this.packaging, this.form, false, this.trackInventory); }
  public changeInventoryTracking(trackInventory: boolean): Product { return new Product(this.id, this.organizationId, this.name, this.code, this.barcode, this.packaging, this.form, this.isActive, trackInventory); }
}
