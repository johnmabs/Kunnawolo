import { Identifier } from "@/shared/domain/identifier";

export type StockLossHistoryItem = Readonly<{
  lossId: string;
  productId: string;
  productName: string;
  productCode: string | null;
  quantity: number;
  reason: string;
  referenceCostMinor: number;
  totalCostMinor: number;
  currency: string;
  actorId: string | null;
  occurredAt: Date;
}>;

export class StockLossHistoryProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier,
    public readonly productId: Identifier | null,
    public readonly items: readonly StockLossHistoryItem[],
  ) {}
  public static create(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productId: string | null;
      items: readonly Omit<StockLossHistoryItem, "totalCostMinor">[];
    }>,
  ): StockLossHistoryProjection {
    return new StockLossHistoryProjection(
      Identifier.fromString(input.organizationId),
      Identifier.fromString(input.shopId),
      input.productId === null ? null : Identifier.fromString(input.productId),
      input.items.map((item) => ({
        ...item,
        productName: item.productName.normalize("NFC"),
        reason: item.reason.normalize("NFC"),
        totalCostMinor: Math.round(item.quantity * item.referenceCostMinor),
      })),
    );
  }
}
