import type { Clock } from "@/shared/domain/clock";
import type { InventorySessionRepository } from "./ports/inventory-session-repository";
export class CloseInventorySession { public constructor(private readonly sessions: InventorySessionRepository, private readonly clock: Clock) {} public async execute(input: Readonly<{ organizationId: string; sessionId: string; actorId: string | null }>): Promise<void> { await this.sessions.close(input.organizationId, input.sessionId, input.actorId, this.clock.now()); } }
