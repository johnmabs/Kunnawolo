import type {
  InventoryReconciliation,
  InventoryReconciliationSnapshot,
} from "../../domain/inventory-reconciliation";

export interface InventoryReconciliationRepository {
  findSnapshots(
    organizationId: string,
    shopId: string,
  ): Promise<readonly InventoryReconciliationSnapshot[]>;
  save(reconciliation: InventoryReconciliation): Promise<void>;
}
