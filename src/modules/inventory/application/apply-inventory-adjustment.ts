import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { InventoryAdjustment } from "../domain/inventory-adjustment";
import type { InventoryAdjustmentRepository } from "./ports/inventory-adjustment-repository";
import type { InventorySessionRepository } from "./ports/inventory-session-repository";

export class ApplyInventoryAdjustment {
  public constructor(private readonly sessions: InventorySessionRepository, private readonly adjustments: InventoryAdjustmentRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {}
  public async execute(input: Readonly<{ organizationId: string; sessionId: string; reference: string; actorId: string | null }>): Promise<InventoryAdjustment> {
    const session = await this.sessions.findClosed(input.organizationId, input.sessionId);
    if (session === null) throw new DomainError("inventory.closed_session_not_found", "A closed inventory session is required for an adjustment.");
    const discrepancies = session.lines.filter((line) => line.countedQuantity !== null && line.countedQuantity.value !== line.expectedQuantity.value);
    const adjustment = InventoryAdjustment.fromClosedSession({ id: this.ids.next(), session, reference: input.reference, actorId: input.actorId, adjustedAt: this.clock.now(), lineIds: discrepancies.map(() => this.ids.next()), movementIds: discrepancies.map(() => this.ids.next()) });
    await this.adjustments.apply(adjustment);
    return adjustment;
  }
}
