import type { StockLevel } from "../../domain/stock-level";

export interface StockLevelRepository {
  ensure(level: StockLevel, audit: Readonly<{ organizationId: string; actorId: string | null; action: string }>): Promise<StockLevel>;
  find(organizationId: string, shopId: string, productId: string): Promise<StockLevel | null>;
  setLowStockThreshold(level: StockLevel, actorId: string | null): Promise<StockLevel>;
  findLowStock(organizationId: string, shopId: string): Promise<StockLevel[]>;
}
