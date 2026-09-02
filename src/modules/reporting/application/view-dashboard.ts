import type { ExpensesReportingSource } from "@/modules/expenses/application/ports/expenses-reporting-source";
import type { InventoryReportingSource } from "@/modules/inventory/application/ports/inventory-reporting-source";
import type { ValuedLossReportingSource } from "@/modules/inventory/application/ports/valued-loss-reporting-source";
import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import type { TransfersReportingSource } from "@/modules/transfers/application/ports/transfers-reporting-source";
import type { Dashboard } from "../domain/dashboard";
import { DashboardFilter } from "../domain/dashboard-filter";
import type { ReportingReadAuthorization } from "./ports/reporting-read-authorization";
import { ProjectDashboard } from "./project-dashboard";

export class ViewDashboard {
  private readonly dashboard: ProjectDashboard;

  public constructor(
    sales: SalesReportingSource,
    inventory: InventoryReportingSource,
    transfers: TransfersReportingSource,
    expenses: ExpensesReportingSource,
    losses: ValuedLossReportingSource,
    private readonly authorization: ReportingReadAuthorization,
  ) {
    this.dashboard = new ProjectDashboard(sales, inventory, transfers, expenses, losses);
  }

  public async execute(input: Readonly<{ organizationId: string; shopId?: string | null; occurredFrom?: Date | null; occurredTo?: Date | null; actorId: string | null }>): Promise<Dashboard> {
    const filter = DashboardFilter.create(input);
    await this.authorization.authorize(filter.organizationId.value, filter.shopId?.value ?? null, input.actorId);
    return this.dashboard.execute({ organizationId: filter.organizationId.value, shopId: filter.shopId?.value ?? null, occurredFrom: filter.occurredFrom, occurredTo: filter.occurredTo });
  }
}
