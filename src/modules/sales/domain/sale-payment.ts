import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { SaleFinalization } from "./sale-cart";

export type PaymentMethod = "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER";
const methods: readonly PaymentMethod[] = ["CASH", "MOBILE_MONEY", "BANK_TRANSFER"];
export class SalePayment {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly cartId: Identifier, public readonly paymentReference: string, public readonly method: PaymentMethod, public readonly amount: Money, public readonly actorId: string | null, public readonly paidAt: Date, public readonly businessReference: string | null) {}
  public static record(input: Readonly<{ id: Identifier; finalization: SaleFinalization; paymentReference: string; method: string; amount: Money; actorId: string | null; paidAt: Date }>): SalePayment {
    const reference = input.paymentReference.trim().normalize("NFC");
    if (reference.length === 0) throw new DomainError("sales.invalid_payment_reference", "A payment reference must be non-empty.");
    if (!methods.includes(input.method as PaymentMethod)) throw new DomainError("sales.invalid_payment_method", "The payment method is unsupported.");
    const expected = input.finalization.totalAmountMinor();
    const currency = input.finalization.lines[0]?.unitPrice.currency;
    if (currency === undefined || input.amount.currency !== currency || input.amount.amountMinor !== expected) throw new DomainError("sales.invalid_payment_amount", "The payment must equal the finalized sale total.");
    return new SalePayment(input.id, input.finalization.organizationId, input.finalization.cartId, reference, input.method as PaymentMethod, input.amount, input.actorId, input.paidAt, null);
  }
  public numbered(businessReference: string): SalePayment { return new SalePayment(this.id, this.organizationId, this.cartId, this.paymentReference, this.method, this.amount, this.actorId, this.paidAt, businessReference); }
  public static reconstitute(input: Readonly<{ id: Identifier; organizationId: Identifier; cartId: Identifier; paymentReference: string; method: PaymentMethod; amount: Money; actorId: string | null; paidAt: Date; businessReference: string }>): SalePayment { return new SalePayment(input.id, input.organizationId, input.cartId, input.paymentReference, input.method, input.amount, input.actorId, input.paidAt, input.businessReference); }
}
