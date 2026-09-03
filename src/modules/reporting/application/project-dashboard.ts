import type { ExpensesReportingSource } from "@/modules/expenses/application/ports/expenses-reporting-source";
import type { InventoryReportingSource } from "@/modules/inventory/application/ports/inventory-reporting-source";
import type { ValuedLossReportingSource } from "@/modules/inventory/application/ports/valued-loss-reporting-source";
import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import type { TransfersReportingSource } from "@/modules/transfers/application/ports/transfers-reporting-source";
import type { Dashboard } from "../domain/dashboard";
import { DashboardFilter } from "../domain/dashboard-filter";
import { ProjectEstimatedResult } from "./project-estimated-result";
import { ProjectSales } from "./project-sales";
import { ProjectStock } from "./project-stock";

export class ProjectDashboard {
  public constructor(
    private readonly sales: SalesReportingSource,
    private readonly inventory: InventoryReportingSource,
    private readonly transfers: TransfersReportingSource,
    private readonly expenses: ExpensesReportingSource,
    private readonly losses: ValuedLossReportingSource,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId?: string | null;
      occurredFrom?: Date | null;
      occurredTo?: Date | null;
    }>,
  ): Promise<Dashboard> {
    const filter = DashboardFilter.create(input);
    const query = {
      organizationId: filter.organizationId.value,
      shopId: filter.shopId?.value ?? null,
      occurredFrom: filter.occurredFrom,
      occurredTo: filter.occurredTo,
    };
    const [sales, stock, estimatedResult] = await Promise.all([
      new ProjectSales(this.sales).execute(query),
      new ProjectStock(this.inventory, this.transfers).execute(query),
      new ProjectEstimatedResult(
        this.sales,
        this.expenses,
        this.losses,
      ).execute(query),
    ]);
    return { filter, sales, stock, estimatedResult };
  }
}
