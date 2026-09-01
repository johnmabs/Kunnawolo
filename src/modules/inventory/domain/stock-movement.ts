import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
export class StockMovement {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly shopId: Identifier, public readonly productId: Identifier, public readonly quantityDelta: number, public readonly reason: string, public readonly actorId: string | null, public readonly idempotencyKey: string | null, public readonly occurredAt: Date) {}
  public static create(input: Readonly<{ id: Identifier; organizationId: Identifier; shopId: Identifier; productId: Identifier; quantityDelta: number; reason: string; actorId: string | null; idempotencyKey?: string | null; occurredAt: Date }>): StockMovement {
    if (!Number.isFinite(input.quantityDelta) || input.quantityDelta === 0) throw new DomainError("inventory.invalid_movement_quantity", "A stock movement quantity must be non-zero.");
    const reason = input.reason.trim().normalize("NFC"); if (reason.length === 0) throw new DomainError("inventory.invalid_movement_reason", "A movement reason must be non-empty.");
    const idempotencyKey = input.idempotencyKey?.trim().normalize("NFC") || null;
    return new StockMovement(input.id, input.organizationId, input.shopId, input.productId, input.quantityDelta, reason, input.actorId, idempotencyKey, input.occurredAt);
  }
}
