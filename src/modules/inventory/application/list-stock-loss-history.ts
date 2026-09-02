import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { StockLossHistoryProjection } from "../domain/stock-loss-history-projection";
import type { InventoryProjectionRepository } from "./ports/inventory-projection-repository";

export class ListStockLossHistory {
  public constructor(private readonly projections: InventoryProjectionRepository) {}
  public async execute(input: Readonly<{ organizationId: string; shopId: string; productId?: string | null }>): Promise<StockLossHistoryProjection> {
    const organizationId = Identifier.fromString(input.organizationId).value;
    const shopId = Identifier.fromString(input.shopId).value;
    const productId = input.productId === null || input.productId === undefined ? null : Identifier.fromString(input.productId).value;
    const projection = await this.projections.listLosses(organizationId, shopId, productId);
    if (projection === null) throw new DomainError("inventory.loss_history_not_found", "The shop or product does not belong to this organization.");
    return projection;
  }
}
