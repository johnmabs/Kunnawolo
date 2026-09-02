import type { Product } from "@/modules/catalog/domain/product";
import type { ProductPricing } from "@/modules/catalog/domain/product-pricing";

export function productDto(product: Product) {
  return {
    barcode: product.barcode,
    code: product.code,
    form: product.form,
    id: product.id.value,
    isActive: product.isActive,
    name: product.name,
    packaging: product.packaging,
    trackInventory: product.trackInventory,
  };
}

export function pricingDto(pricing: ProductPricing | null, currency: string) {
  if (pricing === null) return { currency, current: null };
  return {
    currency,
    current: {
      createdAt: pricing.createdAt,
      reference: pricing.reference,
      referenceCostMinor: pricing.referenceCost.amountMinor,
      salePriceMinor: pricing.salePrice.amountMinor,
    },
  };
}
