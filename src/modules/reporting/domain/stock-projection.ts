import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";

export class StockProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier | null,
    public readonly onHandQuantity: Quantity,
    public readonly inTransitQuantity: Quantity,
    public readonly lossQuantity: Quantity,
    public readonly anomalyCount: number,
  ) {}

  public static create(
    input: Readonly<{
      organizationId: string;
      shopId: string | null;
      onHandQuantity: number;
      inTransitQuantity: number;
      lossQuantity: number;
      anomalyCount: number;
    }>,
  ): StockProjection {
    if (!Number.isSafeInteger(input.anomalyCount) || input.anomalyCount < 0)
      throw new DomainError(
        "reporting.invalid_stock_anomaly_count",
        "The stock anomaly count is invalid.",
      );
    return new StockProjection(
      Identifier.fromString(input.organizationId),
      input.shopId === null ? null : Identifier.fromString(input.shopId),
      Quantity.fromNumber(input.onHandQuantity),
      Quantity.fromNumber(input.inTransitQuantity),
      Quantity.fromNumber(input.lossQuantity),
      input.anomalyCount,
    );
  }
}
