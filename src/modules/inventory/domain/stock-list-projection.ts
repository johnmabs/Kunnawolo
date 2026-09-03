import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type StockListItem = Readonly<{
  stockLevelId: string;
  productId: string;
  productName: string;
  productCode: string | null;
  barcode: string | null;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}>;

export class StockListProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier,
    public readonly shopName: string,
    public readonly items: readonly StockListItem[],
  ) {}

  public static create(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      shopName: string;
      items: readonly Omit<StockListItem, "isLowStock">[];
    }>,
  ): StockListProjection {
    const shopName = input.shopName.trim().normalize("NFC");
    if (shopName.length === 0)
      throw new DomainError(
        "inventory.invalid_shop_name",
        "A stock projection requires a shop name.",
      );
    const items = input.items.map((item) => {
      if (
        !Number.isFinite(item.quantity) ||
        !Number.isFinite(item.lowStockThreshold) ||
        item.lowStockThreshold < 0
      ) {
        throw new DomainError(
          "inventory.invalid_stock_projection",
          "Stock quantities and thresholds must be finite and thresholds cannot be negative.",
        );
      }
      return {
        ...item,
        productName: item.productName.normalize("NFC"),
        isLowStock:
          item.lowStockThreshold > 0 && item.quantity <= item.lowStockThreshold,
      };
    });
    return new StockListProjection(
      Identifier.fromString(input.organizationId),
      Identifier.fromString(input.shopId),
      shopName,
      items,
    );
  }
}
