import type { SaleCart, SaleLine } from "../../domain/sale-cart";
export type SaleAudit = Readonly<{
  organizationId: string;
  actorId: string | null;
  action: string;
}>;
export interface SaleCartRepository {
  create(cart: SaleCart, audit: SaleAudit): Promise<void>;
  find(organizationId: string, cartId: string): Promise<SaleCart | null>;
  saveLine(
    organizationId: string,
    cartId: string,
    line: SaleLine,
    audit: SaleAudit,
  ): Promise<void>;
  removeLine(
    organizationId: string,
    cartId: string,
    lineId: string,
    audit: SaleAudit,
  ): Promise<void>;
}
