import { DomainError } from "@/shared/domain/domain-error";
import { Quantity } from "@/shared/domain/quantity";
import { GetStockLevel } from "./get-stock-level";
import type { StockLevelRepository } from "./ports/stock-level-repository";
export class SetLowStockThreshold {
  public constructor(private readonly levels: StockLevelRepository) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productId: string;
      threshold: number;
      actorId: string | null;
    }>,
  ) {
    if (!Number.isFinite(input.threshold) || input.threshold < 0)
      throw new DomainError(
        "inventory.invalid_low_stock_threshold",
        "A low-stock threshold must be non-negative.",
      );
    const level = await new GetStockLevel(this.levels).execute(input);
    return this.levels.setLowStockThreshold(
      level.withLowStockThreshold(Quantity.fromNumber(input.threshold)),
      input.actorId,
    );
  }
}
