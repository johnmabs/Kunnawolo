import type { StockTransferListProjection } from "../../domain/stock-transfer-list-projection";

export interface StockTransferProjectionRepository {
  list(organizationId: string, shopId: string | null): Promise<StockTransferListProjection | null>;
}
