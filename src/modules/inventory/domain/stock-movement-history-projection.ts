import { Identifier } from "@/shared/domain/identifier";

export type StockMovementHistoryItem = Readonly<{
  movementId: string;
  quantityDelta: number;
  reason: string;
  actorId: string | null;
  occurredAt: Date;
}>;

export class StockMovementHistoryProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier,
    public readonly productId: Identifier,
    public readonly productName: string,
    public readonly items: readonly StockMovementHistoryItem[],
  ) {}
  public static create(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productId: string;
      productName: string;
      items: readonly StockMovementHistoryItem[];
    }>,
  ): StockMovementHistoryProjection {
    return new StockMovementHistoryProjection(
      Identifier.fromString(input.organizationId),
      Identifier.fromString(input.shopId),
      Identifier.fromString(input.productId),
      input.productName.trim().normalize("NFC"),
      input.items.map((item) => ({
        ...item,
        reason: item.reason.normalize("NFC"),
      })),
    );
  }
}
