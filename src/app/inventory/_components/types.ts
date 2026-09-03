export type InventoryAccess = Readonly<{ organizationId: string; shopId: string }>;

export type StockItem = Readonly<{
  barcode: string | null;
  isLowStock: boolean;
  lowStockThreshold: number;
  productCode: string | null;
  productId: string;
  productName: string;
  quantity: number;
  stockLevelId: string;
}>;

export type StockList = Readonly<{ items: readonly StockItem[]; shopId: string; shopName: string }>;

export type StockDetail = Readonly<{
  currency: string;
  isLowStock: boolean;
  lowStockThreshold: number;
  productCode: string | null;
  productId: string;
  productName: string;
  quantity: number;
  referenceCostMinor: number;
}>;

export type InventorySessionItem = Readonly<{
  closedAt: string | null;
  countedLineCount: number;
  discrepancyLineCount: number;
  discrepancyQuantity: number;
  openedAt: string;
  progressPercentage: number;
  sessionId: string;
  status: string;
  totalLineCount: number;
}>;

export type InventorySessionList = Readonly<{ items: readonly InventorySessionItem[]; shopId: string; shopName: string }>;

export class InventoryApiError extends Error {
  public constructor(public readonly code: string) { super(code); this.name = "InventoryApiError"; }
}
