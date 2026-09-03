import type { SalePayment } from "../../domain/sale-payment";
export interface SalePaymentRepository {
  findByReference(
    organizationId: string,
    reference: string,
  ): Promise<SalePayment | null>;
  record(payment: SalePayment): Promise<SalePayment>;
}
