import {
  ExpenseApiError,
  type ExpenseAccess,
  type ExpenseFilters,
  type ExpenseList,
} from "./types";
async function request<T>(
  url: string,
  _access: ExpenseAccess,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json()) as T & Readonly<{ code?: string }>;
  if (!response.ok)
    throw new ExpenseApiError(body.code ?? "expenses.unknown_error");
  return body;
}
export function listExpenses(
  access: ExpenseAccess,
  filters: ExpenseFilters,
): Promise<ExpenseList> {
  const search = new URLSearchParams({
    organizationId: access.organizationId,
    shopId: access.shopId,
    status: filters.status,
  });
  if (filters.query.trim()) search.set("query", filters.query.trim());
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  return request(`/api/expenses?${search}`, access);
}
export async function cancelExpense(
  access: ExpenseAccess,
  expenseId: string,
  reference: string,
  reason: string,
): Promise<void> {
  await request(`/api/expenses/${expenseId}/cancellation`, access, {
    method: "POST",
    body: JSON.stringify({
      organizationId: access.organizationId,
      reference,
      reason,
    }),
  });
}
