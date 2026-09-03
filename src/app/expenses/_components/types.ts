export type ExpenseAccess = Readonly<{ organizationId: string; shopId: string }>;
export type ExpenseCancellation = Readonly<{ reference: string; reason: string; cancelledAt: string }>;
export type ExpenseItem = Readonly<{ id: string; shopId: string | null; categoryId: string; categoryName: string; amountMinor: number; currency: string; reference: string; description: string; occurredAt: string; cancellation: ExpenseCancellation | null }>;
export type ExpenseList = Readonly<{ items: readonly ExpenseItem[] }>;
export type ExpenseFilters = Readonly<{ query: string; from: string; to: string; status: "ACTIVE" | "CANCELLED" | "ALL" }>;
export class ExpenseApiError extends Error { public constructor(public readonly code: string) { super(code); this.name = "ExpenseApiError"; } }
