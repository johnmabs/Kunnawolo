import { Identifier } from "@/shared/domain/identifier";

export type StockTransferListLine = Readonly<{
  productId: string;
  productName: string;
  productCode: string | null;
  quantity: number;
}>;
export type StockTransferListItem = Readonly<{
  transferId: string;
  sourceShopId: string;
  sourceShopName: string;
  destinationShopId: string;
  destinationShopName: string;
  status: string;
  lines: readonly StockTransferListLine[];
  productCount: number;
  totalQuantity: number;
  shipmentReference: string | null;
  receptionReference: string | null;
  cancellationReference: string | null;
  createdAt: Date;
  sentAt: Date | null;
  receivedAt: Date | null;
  cancelledAt: Date | null;
}>;

export class StockTransferListProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly items: readonly StockTransferListItem[],
  ) {}
  public static create(
    organizationId: string,
    items: readonly Omit<
      StockTransferListItem,
      "productCount" | "totalQuantity"
    >[],
  ): StockTransferListProjection {
    return new StockTransferListProjection(
      Identifier.fromString(organizationId),
      items.map((item) => ({
        ...item,
        sourceShopName: item.sourceShopName.normalize("NFC"),
        destinationShopName: item.destinationShopName.normalize("NFC"),
        lines: item.lines.map((line) => ({
          ...line,
          productName: line.productName.normalize("NFC"),
        })),
        productCount: item.lines.length,
        totalQuantity: item.lines.reduce(
          (total, line) => total + line.quantity,
          0,
        ),
      })),
    );
  }
}
