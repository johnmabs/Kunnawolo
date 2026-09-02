import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { StockLoss } from "../domain/stock-loss";
import type { StockLossRepository } from "./ports/stock-loss-repository";

export class RecordStockLoss {
  public constructor(private readonly losses: StockLossRepository, private readonly ids: IdentifierGenerator, private readonly clock: Clock) {}
  public async execute(input: Readonly<{ organizationId: string; shopId: string; productId: string; quantity: number; reason: string; referenceCostMinor: number; currency: string; actorId: string | null }>): Promise<StockLoss> {
    const loss = StockLoss.create({ id: this.ids.next(), organizationId: Identifier.fromString(input.organizationId), shopId: Identifier.fromString(input.shopId), productId: Identifier.fromString(input.productId), quantity: Quantity.fromNumber(input.quantity), reason: input.reason, referenceCost: Money.fromMinor(input.referenceCostMinor, input.currency), actorId: input.actorId, occurredAt: this.clock.now() });
    if (!loss.quantity.isPositive()) throw new DomainError("inventory.invalid_loss_quantity", "A stock loss quantity must be strictly positive.");
    await this.losses.record(loss); return loss;
  }
}
