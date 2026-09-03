export type TransferAccess = Readonly<{
  organizationId: string;
  shopId: string;
}>;

export type TransferLine = Readonly<{
  productCode: string | null;
  productId: string;
  productName: string;
  quantity: number;
}>;

export type TransferItem = Readonly<{
  cancelledAt: string | null;
  cancellationReference: string | null;
  createdAt: string;
  destinationShopId: string;
  destinationShopName: string;
  lines: readonly TransferLine[];
  productCount: number;
  receivedAt: string | null;
  receptionReference: string | null;
  sentAt: string | null;
  shipmentReference: string | null;
  sourceShopId: string;
  sourceShopName: string;
  status: string;
  totalQuantity: number;
  transferId: string;
}>;

export type TransferList = Readonly<{ items: readonly TransferItem[] }>;

export type TransferProduct = Readonly<{
  barcode: string | null;
  code: string | null;
  id: string;
  name: string;
  trackInventory: boolean;
}>;

export type TransferProductSearch = Readonly<{ items: readonly TransferProduct[] }>;

export class TransferApiError extends Error {
  public constructor(public readonly code: string) {
    super(code);
    this.name = "TransferApiError";
  }
}
