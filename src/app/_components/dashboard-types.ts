export type DashboardAccess = Readonly<{ organizationId: string }>;
export type DashboardFilters = Readonly<{ shopId: string | null; from: string; to: string }>;
type Money = Readonly<{ amountMinor: number; currency: string }>;
type Quantity = Readonly<{ value: number }>;
export type Dashboard = Readonly<{
  sales: Readonly<{ revenue: Money; costOfGoodsSold: Money; grossMargin: Money; saleCount: number }>;
  stock: Readonly<{ onHandQuantity: Quantity; inTransitQuantity: Quantity; lossQuantity: Quantity; anomalyCount: number }>;
  estimatedResult: Readonly<{ grossMargin: Money; activeExpenses: Money; valuedLosses: Money; amount: Money }>;
}>;
export class DashboardApiError extends Error { public constructor(public readonly code: string) { super(code); this.name = "DashboardApiError"; } }
