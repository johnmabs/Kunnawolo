export type ProductSearchItem = Readonly<{
  barcode: string | null;
  code: string | null;
  id: string;
  name: string;
  trackInventory: boolean;
}>;

export type ProductSearchResult = Readonly<{
  items: readonly ProductSearchItem[];
  pricingAvailable: boolean;
}>;

export type SaleLineDto = Readonly<{
  currency: string;
  discountMinor: number;
  id: string;
  isBelowCost: boolean;
  lineTotalMinor: number;
  productId: string;
  productName: string;
  quantity: number;
  unitCostMinor: number;
  unitPriceMinor: number;
}>;

export type SaleCartDto = Readonly<{
  discountMinor: number;
  id: string;
  lines: readonly SaleLineDto[];
  shopId: string;
  subtotalMinor: number;
  totalMinor: number;
}>;

export type SalePaymentDto = Readonly<{
  amountMinor: number;
  businessReference: string | null;
  cartId: string;
  currency: string;
  method: PaymentMethod;
}>;

export type PaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER";

export type SalesAccess = Readonly<{
  apiKey: string;
  organizationId: string;
}>;

export class SalesApiError extends Error {
  public constructor(public readonly code: string) {
    super(code);
    this.name = "SalesApiError";
  }
}
