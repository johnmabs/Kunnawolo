import type { Dashboard } from "./dashboard";

const csv = (value: string | number | null): string => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function dashboardAsCsv(dashboard: Dashboard): string {
  const { filter, sales, stock, estimatedResult } = dashboard;
  const rows: ReadonlyArray<readonly [string, string | number | null]> = [
    ["organization_id", filter.organizationId.value],
    ["shop_id", filter.shopId?.value ?? null],
    ["occurred_from", filter.occurredFrom?.toISOString() ?? null],
    ["occurred_to", filter.occurredTo?.toISOString() ?? null],
    ["currency", sales.revenue.currency],
    ["sale_count", sales.saleCount],
    ["revenue_minor", sales.revenue.amountMinor],
    ["cost_of_goods_sold_minor", sales.costOfGoodsSold.amountMinor],
    ["gross_margin_minor", sales.grossMargin.amountMinor],
    ["on_hand_quantity", stock.onHandQuantity.value],
    ["in_transit_quantity", stock.inTransitQuantity.value],
    ["loss_quantity", stock.lossQuantity.value],
    ["anomaly_count", stock.anomalyCount],
    ["active_expenses_minor", estimatedResult.activeExpenses.amountMinor],
    ["valued_losses_minor", estimatedResult.valuedLosses.amountMinor],
    ["estimated_result_minor", estimatedResult.amount.amountMinor],
  ];
  return ["metric,value", ...rows.map(([metric, value]) => `${csv(metric)},${csv(value)}`)].join("\n");
}
