import type { ExpensesReportingSource } from "@/modules/expenses/application/ports/expenses-reporting-source";
import type { ValuedLossReportingSource } from "@/modules/inventory/application/ports/valued-loss-reporting-source";
import type { SalesReportingSource } from "@/modules/sales/application/ports/sales-reporting-source";
import { Money } from "@/shared/domain/money";
import { ProjectSales } from "./project-sales";
import { EstimatedResult } from "../domain/estimated-result";
export class ProjectEstimatedResult {
  public constructor(
    private readonly sales: SalesReportingSource,
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
  ) {
    const shopId = input.shopId ?? null;
    const period = {
      organizationId: input.organizationId,
      shopId,
      occurredFrom: input.occurredFrom ?? null,
      occurredTo: input.occurredTo ?? null,
    };
    const [sales, expenses, losses] = await Promise.all([
      new ProjectSales(this.sales).execute(period),
      this.expenses.activeExpenseAmount(period),
      this.losses.valuedLossAmount(period),
    ]);
    return EstimatedResult.create({
      organizationId: input.organizationId,
      shopId,
      grossMargin: sales.grossMargin,
      activeExpenses: Money.fromMinor(expenses.amountMinor, expenses.currency),
      valuedLosses: Money.fromMinor(losses.amountMinor, losses.currency),
    });
  }
}
