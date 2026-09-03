import type { Clock } from "@/shared/domain/clock";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import {
  InventorySession,
  InventorySessionLine,
} from "../domain/inventory-session";
import type { InventorySessionRepository } from "./ports/inventory-session-repository";
export class OpenInventorySession {
  public constructor(
    private readonly sessions: InventorySessionRepository,
    private readonly ids: IdentifierGenerator,
    private readonly clock: Clock,
  ) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      actorId: string | null;
      levels: readonly { productId: string; quantity: number }[];
    }>,
  ): Promise<InventorySession> {
    const session = InventorySession.open(
      this.ids.next(),
      Identifier.fromString(input.organizationId),
      Identifier.fromString(input.shopId),
      input.levels.map((level) =>
        InventorySessionLine.snapshot(
          this.ids.next(),
          Identifier.fromString(level.productId),
          Quantity.fromNumber(level.quantity),
        ),
      ),
    );
    await this.sessions.open(session, input.actorId, this.clock.now());
    return session;
  }
}
