import type { EstimatedResult } from "./estimated-result";
import type { SalesProjection } from "./sales-projection";
import type { StockProjection } from "./stock-projection";
import type { DashboardFilter } from "./dashboard-filter";

export type Dashboard = Readonly<{
  filter: DashboardFilter;
  sales: SalesProjection;
  stock: StockProjection;
  estimatedResult: EstimatedResult;
}>;
