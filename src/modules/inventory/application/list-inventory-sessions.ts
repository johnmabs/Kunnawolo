import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { InventorySessionListProjection } from "../domain/inventory-session-list-projection";
import type { InventoryProjectionRepository } from "./ports/inventory-projection-repository";

export class ListInventorySessions {
  public constructor(private readonly projections: InventoryProjectionRepository) {}
  public async execute(input: Readonly<{ organizationId: string; shopId: string }>): Promise<InventorySessionListProjection> {
    const projection = await this.projections.listSessions(Identifier.fromString(input.organizationId).value, Identifier.fromString(input.shopId).value);
    if (projection === null) throw new DomainError("inventory.shop_not_found", "The shop does not belong to this organization.");
    return projection;
  }
}
