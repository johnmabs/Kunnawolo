import type { Clock } from "@/shared/domain/clock";
import { Identifier } from "@/shared/domain/identifier";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { InventoryReconciliation } from "../domain/inventory-reconciliation";
import type { InventoryReconciliationRepository } from "./ports/inventory-reconciliation-repository";

export class ReconcileInventory {
  public constructor(private readonly reconciliations: InventoryReconciliationRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {}
  public async execute(input: Readonly<{ organizationId: string; shopId: string; reference: string; actorId: string | null }>): Promise<InventoryReconciliation> {
    const snapshots = await this.reconciliations.findSnapshots(input.organizationId, input.shopId);
    const divergences = snapshots.filter((snapshot) => snapshot.stockLevelQuantity !== snapshot.ledgerQuantity);
    const reconciliation = InventoryReconciliation.detect({ id: this.ids.next(), organizationId: Identifier.fromString(input.organizationId), shopId: Identifier.fromString(input.shopId), reference: input.reference, actorId: input.actorId, reconciledAt: this.clock.now(), snapshots, lineIds: divergences.map(() => this.ids.next()) });
    await this.reconciliations.save(reconciliation);
    return reconciliation;
  }
}
