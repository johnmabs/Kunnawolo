import type { StockMovement } from "../../domain/stock-movement";
export interface StockMovementRepository {
  apply(movement: StockMovement): Promise<void>;
}
