import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { SalePaymentRepository } from "../application/ports/sale-payment-repository";
import { SalePayment, type PaymentMethod } from "../domain/sale-payment";

type PaymentRow = Readonly<{ id: string; organizationId: string; saleCartId: string; paymentReference: string; method: string; amountMinor: bigint; currency: string; actorId: string | null; paidAt: Date; saleCart: { businessReference: string | null } }>;
function toPayment(row: PaymentRow): SalePayment { if (row.saleCart.businessReference === null) throw new DomainError("sales.invalid_payment_state", "A paid sale needs a business reference."); return SalePayment.reconstitute({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), cartId: Identifier.fromString(row.saleCartId), paymentReference: row.paymentReference, method: row.method as PaymentMethod, amount: Money.fromMinor(Number(row.amountMinor), row.currency), actorId: row.actorId, paidAt: row.paidAt, businessReference: row.saleCart.businessReference }); }

export class PrismaSalePaymentRepository implements SalePaymentRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async findByReference(organizationId: string, reference: string): Promise<SalePayment | null> { const row = await this.prisma.salePayment.findFirst({ where: { organizationId, paymentReference: reference }, include: { saleCart: { select: { businessReference: true } } } }); return row === null ? null : toPayment(row); }
  public async record(payment: SalePayment): Promise<SalePayment> {
    return this.prisma.$transaction(async (tx) => {
      const byReference = await tx.salePayment.findFirst({ where: { organizationId: payment.organizationId.value, paymentReference: payment.paymentReference }, include: { saleCart: { select: { businessReference: true } } } });
      if (byReference !== null) { if (byReference.saleCartId === payment.cartId.value) return toPayment(byReference); throw new DomainError("sales.payment_reference_taken", "The payment reference is already used."); }
      const reserved = await tx.saleCart.updateMany({ where: { id: payment.cartId.value, organizationId: payment.organizationId.value, status: "FINALIZED" }, data: { status: "PAYING" } });
      if (reserved.count !== 1) throw new DomainError("sales.sale_not_finalized", "The sale cannot be paid in this organization.");
      const sequence = await tx.salesSequence.upsert({ where: { organizationId: payment.organizationId.value }, create: { organizationId: payment.organizationId.value, nextValue: 2 }, update: { nextValue: { increment: 1 } } });
      const businessReference = `SALE-${String(sequence.nextValue - 1).padStart(6, "0")}`;
      await tx.salePayment.create({ data: { id: payment.id.value, organizationId: payment.organizationId.value, saleCartId: payment.cartId.value, paymentReference: payment.paymentReference, method: payment.method, status: "PAID", amountMinor: BigInt(payment.amount.amountMinor), currency: payment.amount.currency, actorId: payment.actorId, paidAt: payment.paidAt } });
      await tx.saleCart.update({ where: { id: payment.cartId.value }, data: { status: "PAID", businessReference } });
      await tx.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: payment.organizationId.value, actorId: payment.actorId, action: "sale.payment_recorded" } });
      return payment.numbered(businessReference);
    });
  }
}
