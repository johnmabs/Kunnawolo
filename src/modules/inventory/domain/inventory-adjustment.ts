import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import { InventorySession } from "./inventory-session";

export class InventoryAdjustment {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly sessionId: Identifier, public readonly shopId: Identifier, public readonly reference: string, public readonly actorId: string | null, public readonly adjustedAt: Date, public readonly lines: readonly InventoryAdjustmentLine[]) {}
  public static fromClosedSession(input: Readonly<{ id: Identifier; session: InventorySession; reference: string; actorId: string | null; adjustedAt: Date; lineIds: readonly Identifier[]; movementIds: readonly Identifier[] }>): InventoryAdjustment {
    const reference = input.reference.trim().normalize("NFC");
    if (reference.length === 0) throw new DomainError("inventory.invalid_adjustment_reference", "An inventory adjustment reference must be non-empty.");
    const discrepancies = input.session.lines.filter((line) => line.countedQuantity !== null && line.countedQuantity.value !== line.expectedQuantity.value);
    if (discrepancies.length === 0) throw new DomainError("inventory.no_adjustment_required", "The inventory session has no discrepancy to adjust.");
    if (discrepancies.length !== input.lineIds.length || discrepancies.length !== input.movementIds.length) throw new DomainError("inventory.invalid_adjustment_lines", "Every discrepancy must have one adjustment line and movement.");
    return new InventoryAdjustment(input.id, input.session.organizationId, input.session.id, input.session.shopId, reference, input.actorId, input.adjustedAt, discrepancies.map((line, index) => InventoryAdjustmentLine.create(input.lineIds[index], input.movementIds[index], line.productId, line.expectedQuantity, line.countedQuantity!)));
  }
}

export class InventoryAdjustmentLine {
  private constructor(public readonly id: Identifier, public readonly stockMovementId: Identifier, public readonly productId: Identifier, public readonly expectedQuantity: Quantity, public readonly countedQuantity: Quantity, public readonly quantityDelta: number) {}
  public static create(id: Identifier, stockMovementId: Identifier, productId: Identifier, expectedQuantity: Quantity, countedQuantity: Quantity): InventoryAdjustmentLine {
    const quantityDelta = countedQuantity.value - expectedQuantity.value;
    if (quantityDelta === 0) throw new DomainError("inventory.invalid_adjustment_line", "An adjustment line must represent a discrepancy.");
    return new InventoryAdjustmentLine(id, stockMovementId, productId, expectedQuantity, countedQuantity, quantityDelta);
  }
}
