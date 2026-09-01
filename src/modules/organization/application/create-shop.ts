import { Shop } from "../domain/shop";
import type { AuditLog } from "./ports/audit-log";
import type { IdentifierGenerator } from "./ports/identifier-generator";
import type { ShopRepository } from "./ports/shop-repository";
import { Identifier } from "@/shared/domain/identifier";

export class CreateShop {
  public constructor(private readonly shops: ShopRepository, private readonly audit: AuditLog, private readonly ids: IdentifierGenerator) {}
  public async execute(input: Readonly<{ organizationId: string; code: string; name: string; actorId: string | null }>): Promise<Shop> {
    const shop = Shop.create(this.ids.next(), Identifier.fromString(input.organizationId), input.code, input.name);
    await this.shops.save(shop);
    await this.audit.record({ organizationId: input.organizationId, actorId: input.actorId, action: "shop.created" });
    return shop;
  }
}
