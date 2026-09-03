import type { InventoryAdjustment } from "../../domain/inventory-adjustment";

export interface InventoryAdjustmentRepository {
  apply(adjustment: InventoryAdjustment): Promise<void>;
}
