import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import { SalesProjection } from "../domain/sales-projection";
import { SalesProjectionQuery } from "../domain/sales-projection-query";

export class ProjectSales {
  public constructor(private readonly sales: SalesReportingSource) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId?: string | null;
      occurredFrom?: Date | null;
      occurredTo?: Date | null;
    }>,
  ): Promise<SalesProjection> {
    const query = SalesProjectionQuery.create(input);
    const data = await this.sales.listFinalizedSales({
      organizationId: query.organizationId.value,
      shopId: query.shopId?.value ?? null,
      occurredFrom: query.occurredFrom,
      occurredTo: query.occurredTo,
    });
    return SalesProjection.fromSales({
      organizationId: query.organizationId.value,
      shopId: query.shopId?.value ?? null,
      currency: data.currency,
      sales: data.sales,
    });
  }
}
