import type { InventoryReportingSource } from "@/modules/inventory/application/ports/inventory-reporting-source";
import type { TransfersReportingSource } from "@/modules/transfers/application/ports/transfers-reporting-source";
import { StockProjection } from "../domain/stock-projection";
import { StockProjectionQuery } from "../domain/stock-projection-query";

export class ProjectStock {
  public constructor(
    private readonly inventory: InventoryReportingSource,
    private readonly transfers: TransfersReportingSource,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId?: string | null;
      occurredFrom?: Date | null;
      occurredTo?: Date | null;
    }>,
  ): Promise<StockProjection> {
    const query = StockProjectionQuery.create(input);
    const scope = {
      organizationId: query.organizationId.value,
      shopId: query.shopId?.value ?? null,
    };
    const [inventory, inTransitQuantity] = await Promise.all([
      this.inventory.projectStock({
        ...scope,
        occurredFrom: query.occurredFrom,
        occurredTo: query.occurredTo,
      }),
      this.transfers.inTransitQuantity(scope),
    ]);
    return StockProjection.create({
      ...scope,
      ...inventory,
      inTransitQuantity,
    });
  }
}
