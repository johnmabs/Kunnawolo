import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { StockMovementHistoryProjection } from "../domain/stock-movement-history-projection";
import type { InventoryProjectionRepository } from "./ports/inventory-projection-repository";

export class ListStockMovementHistory {
  public constructor(
    private readonly projections: InventoryProjectionRepository,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productId: string;
    }>,
  ): Promise<StockMovementHistoryProjection> {
    const projection = await this.projections.listMovements(
      Identifier.fromString(input.organizationId).value,
      Identifier.fromString(input.shopId).value,
      Identifier.fromString(input.productId).value,
    );
    if (projection === null)
      throw new DomainError(
        "inventory.stock_history_not_found",
        "The shop or product does not belong to this organization.",
      );
    return projection;
  }
}
