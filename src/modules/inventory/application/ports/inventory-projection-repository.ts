import type { InventorySessionListProjection } from "../../domain/inventory-session-list-projection";
import type { StockListProjection } from "../../domain/stock-list-projection";
import type { StockLossHistoryProjection } from "../../domain/stock-loss-history-projection";
import type { StockMovementHistoryProjection } from "../../domain/stock-movement-history-projection";

export interface InventoryProjectionRepository {
  listStock(
    organizationId: string,
    shopId: string,
    productSearch: string | null,
  ): Promise<StockListProjection | null>;
  listSessions(
    organizationId: string,
    shopId: string,
  ): Promise<InventorySessionListProjection | null>;
  listMovements(
    organizationId: string,
    shopId: string,
    productId: string,
  ): Promise<StockMovementHistoryProjection | null>;
  listLosses(
    organizationId: string,
    shopId: string,
    productId: string | null,
  ): Promise<StockLossHistoryProjection | null>;
}
