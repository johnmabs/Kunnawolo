import { Quantity } from "@/shared/domain/quantity";
import type { InventorySessionRepository } from "./ports/inventory-session-repository";
export class CountInventorySessionLine { public constructor(private readonly sessions: InventorySessionRepository) {} public async execute(input: Readonly<{ organizationId: string; sessionId: string; productId: string; quantity: number; actorId: string | null }>): Promise<void> { await this.sessions.count(input.organizationId, input.sessionId, input.productId, Quantity.fromNumber(input.quantity).value, input.actorId); } }
