export type ExpenseReadScope = Readonly<{ shopIds: readonly string[] | null }>;

export interface ExpenseReadAuthorization {
  authorize(organizationId: string, requestedShopId: string | null, actorId: string | null): Promise<ExpenseReadScope>;
}
