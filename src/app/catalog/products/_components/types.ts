export type CatalogAccess = Readonly<{ organizationId: string }>;
export type ProductItem = Readonly<{
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  packaging: string | null;
  form: string | null;
  isActive: boolean;
  trackInventory: boolean;
}>;
export type CurrentPricing = Readonly<{
  createdAt: string;
  reference: string;
  referenceCostMinor: number;
  salePriceMinor: number;
}>;
export type ProductDetail = ProductItem &
  Readonly<{
    pricing: Readonly<{ currency: string; current: CurrentPricing | null }>;
  }>;
export type ProductList = Readonly<{ items: readonly ProductItem[] }>;
export type ProductInput = Readonly<{
  name: string;
  code: string;
  barcode: string;
  packaging: string;
  form: string;
  trackInventory: boolean;
}>;

export class CatalogApiError extends Error {
  public constructor(public readonly code: string) {
    super(code);
    this.name = "CatalogApiError";
  }
}
