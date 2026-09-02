import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Money } from "@/shared/domain/money";
import type { FinalizedSaleSnapshot } from "@/modules/sales/application/ports/sales-reporting-source";

export class SalesProjection {
  private constructor(
    public readonly organizationId: Identifier,
    public readonly shopId: Identifier | null,
    public readonly revenue: Money,
    public readonly costOfGoodsSold: Money,
    public readonly grossMargin: Money,
    public readonly saleCount: number,
  ) {}

  public static fromSales(input: Readonly<{ organizationId: string; shopId: string | null; currency: string; sales: readonly FinalizedSaleSnapshot[] }>): SalesProjection {
    let revenueMinor = 0;
    let costMinor = 0;
    for (const sale of input.sales) {
      if (sale.currency !== input.currency || !Number.isSafeInteger(sale.revenueMinor) || !Number.isSafeInteger(sale.costMinor) || sale.revenueMinor < 0 || sale.costMinor < 0) throw new DomainError("reporting.invalid_sales_snapshot", "A finalized sale snapshot is invalid for reporting.");
      revenueMinor += sale.revenueMinor;
      costMinor += sale.costMinor;
      if (!Number.isSafeInteger(revenueMinor) || !Number.isSafeInteger(costMinor)) throw new DomainError("reporting.sales_projection_overflow", "The sales projection exceeds safe money bounds.");
    }
    return new SalesProjection(Identifier.fromString(input.organizationId), input.shopId === null ? null : Identifier.fromString(input.shopId), Money.fromMinor(revenueMinor, input.currency), Money.fromMinor(costMinor, input.currency), Money.fromMinor(revenueMinor - costMinor, input.currency), input.sales.length);
  }
}
