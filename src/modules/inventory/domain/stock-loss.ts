import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";

export class StockLoss {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier,
    public readonly productId: Identifier,
    public readonly quantity: Quantity,
    public readonly reason: string,
    public readonly referenceCost: Money,
    public readonly actorId: string | null,
    public readonly occurredAt: Date,
  ) {}
  public static create(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      shopId: Identifier;
      productId: Identifier;
      quantity: Quantity;
      reason: string;
      referenceCost: Money;
      actorId: string | null;
      occurredAt: Date;
    }>,
  ): StockLoss {
    if (!input.quantity.isPositive())
      throw new DomainError(
        "inventory.invalid_loss_quantity",
        "A stock loss quantity must be strictly positive.",
      );
    const reason = input.reason.trim().normalize("NFC");
    if (reason.length === 0)
      throw new DomainError(
        "inventory.invalid_loss_reason",
        "A stock loss reason must be non-empty.",
      );
    if (input.referenceCost.amountMinor < 0)
      throw new DomainError(
        "inventory.invalid_loss_cost",
        "A stock loss cost cannot be negative.",
      );
    return new StockLoss(
      input.id,
      input.organizationId,
      input.shopId,
      input.productId,
      input.quantity,
      reason,
      input.referenceCost,
      input.actorId,
      input.occurredAt,
    );
  }
}
