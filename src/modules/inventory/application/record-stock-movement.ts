import { Identifier } from "@/shared/domain/identifier";
import type { Clock } from "@/shared/domain/clock";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { StockMovement } from "../domain/stock-movement";
import type { StockMovementRepository } from "./ports/stock-movement-repository";
export class RecordStockMovement { public constructor(private readonly movements: StockMovementRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {} public async execute(input: Readonly<{ organizationId: string; shopId: string; productId: string; quantityDelta: number; reason: string; actorId: string | null; idempotencyKey?: string | null }>): Promise<StockMovement> { const movement = StockMovement.create({ id: this.ids.next(), organizationId: Identifier.fromString(input.organizationId), shopId: Identifier.fromString(input.shopId), productId: Identifier.fromString(input.productId), quantityDelta: input.quantityDelta, reason: input.reason, actorId: input.actorId, idempotencyKey: input.idempotencyKey, occurredAt: this.clock.now() }); await this.movements.apply(movement); return movement; } }
