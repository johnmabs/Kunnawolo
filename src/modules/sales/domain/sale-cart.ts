import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import { Quantity } from "@/shared/domain/quantity";

export class SaleLine {
  private constructor(public readonly id: Identifier, public readonly productId: Identifier, public readonly productNameSnapshot: string, public readonly quantity: Quantity, public readonly unitPrice: Money, public readonly unitCost: Money, public readonly discount: Money) {}
  public static create(input: Readonly<{ id: Identifier; productId: Identifier; productNameSnapshot: string; quantity: Quantity; unitPrice: Money; unitCost: Money; discount: Money }>): SaleLine {
    if (!input.quantity.isPositive()) throw new DomainError("sales.invalid_line_quantity", "A sale line quantity must be positive.");
    if (input.unitPrice.currency !== input.unitCost.currency || input.unitPrice.currency !== input.discount.currency) throw new DomainError("sales.currency_mismatch", "Sale snapshots must share a currency.");
    if (input.unitPrice.amountMinor <= 0 || input.unitCost.amountMinor < 0) throw new DomainError("sales.invalid_line_money", "Price must be positive and cost non-negative.");
    if (input.discount.amountMinor < 0 || input.discount.amountMinor > input.unitPrice.amountMinor * input.quantity.value) throw new DomainError("sales.invalid_discount", "Discount exceeds the line gross amount.");
    const name = input.productNameSnapshot.trim().normalize("NFC");
    if (name.length === 0) throw new DomainError("sales.invalid_product_snapshot", "A product name snapshot must be non-empty.");
    return new SaleLine(input.id, input.productId, name, input.quantity, input.unitPrice, input.unitCost, input.discount);
  }
}

export class SaleCart {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly shopId: Identifier, public readonly lines: readonly SaleLine[]) {}
  public static draft(id: Identifier, organizationId: Identifier, shopId: Identifier, lines: readonly SaleLine[] = []): SaleCart { return new SaleCart(id, organizationId, shopId, lines); }
  public addOrReplace(line: SaleLine): SaleCart { return new SaleCart(this.id, this.organizationId, this.shopId, [...this.lines.filter(({ id }) => !id.equals(line.id)), line]); }
  public remove(lineId: Identifier): SaleCart { return new SaleCart(this.id, this.organizationId, this.shopId, this.lines.filter(({ id }) => !id.equals(lineId))); }
  public finalize(reference: string, actorId: string | null, finalizedAt: Date): SaleFinalization {
    if (this.lines.length === 0) throw new DomainError("sales.empty_cart", "An empty cart cannot be finalized.");
    const normalizedReference = reference.trim().normalize("NFC");
    if (normalizedReference.length === 0) throw new DomainError("sales.invalid_finalization_reference", "A finalization reference must be non-empty.");
    return SaleFinalization.create(this.id, this.organizationId, this.shopId, this.lines, normalizedReference, actorId, finalizedAt);
  }
}

export class SaleFinalization {
  private constructor(public readonly cartId: Identifier, public readonly organizationId: Identifier, public readonly shopId: Identifier, public readonly lines: readonly SaleLine[], public readonly reference: string, public readonly actorId: string | null, public readonly finalizedAt: Date) {}
  public static create(cartId: Identifier, organizationId: Identifier, shopId: Identifier, lines: readonly SaleLine[], reference: string, actorId: string | null, finalizedAt: Date): SaleFinalization { return new SaleFinalization(cartId, organizationId, shopId, lines, reference.trim().normalize("NFC"), actorId, finalizedAt); }
  public totalAmountMinor(): number { const amount = this.lines.reduce((total, line) => total + line.unitPrice.amountMinor * line.quantity.value - line.discount.amountMinor, 0); if (!Number.isSafeInteger(amount) || amount <= 0) throw new DomainError("sales.invalid_payment_amount", "The finalized sale amount must be a positive integer in minor units."); return amount; }
}
