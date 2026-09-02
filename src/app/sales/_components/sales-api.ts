import type { PaymentMethod, ProductSearchResult, SaleCartDto, SalePaymentDto, SalesAccess } from "./types";
import { SalesApiError } from "./types";

async function apiRequest<T>(url: string, access: SalesAccess, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${access.apiKey}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json() as T & Readonly<{ code?: string }>;
  if (!response.ok) throw new SalesApiError(body.code ?? "sales.unknown_error");
  return body;
}

export function searchProducts(access: SalesAccess, query: string): Promise<ProductSearchResult> {
  const search = new URLSearchParams({ organizationId: access.organizationId, query });
  return apiRequest(`/api/catalog/products?${search.toString()}`, access);
}

export function createCart(access: SalesAccess, shopId: string): Promise<SaleCartDto> {
  return apiRequest("/api/sales/carts", access, { method: "POST", body: JSON.stringify({ organizationId: access.organizationId, shopId }) });
}

export function addLine(access: SalesAccess, cartId: string, productId: string): Promise<SaleCartDto> {
  return apiRequest(`/api/sales/carts/${cartId}/lines`, access, { method: "POST", body: JSON.stringify({ organizationId: access.organizationId, productId, quantity: 1, discountMinor: 0 }) });
}

export function updateLine(access: SalesAccess, cartId: string, input: Readonly<{ discountMinor: number; lineId: string; productId: string; quantity: number }>): Promise<SaleCartDto> {
  return apiRequest(`/api/sales/carts/${cartId}/lines`, access, { method: "PUT", body: JSON.stringify({ organizationId: access.organizationId, ...input }) });
}

export function removeLine(access: SalesAccess, cartId: string, lineId: string): Promise<SaleCartDto> {
  return apiRequest(`/api/sales/carts/${cartId}/lines`, access, { method: "DELETE", body: JSON.stringify({ organizationId: access.organizationId, lineId }) });
}

export async function finalizeCart(access: SalesAccess, cartId: string, underCostReason: string | null): Promise<void> {
  await apiRequest(`/api/sales/carts/${cartId}/finalization`, access, { method: "POST", body: JSON.stringify({ organizationId: access.organizationId, reference: crypto.randomUUID(), underCostReason }) });
}

export function paySale(access: SalesAccess, cart: SaleCartDto, method: PaymentMethod): Promise<SalePaymentDto> {
  const currency = cart.lines[0]?.currency;
  if (!currency) throw new SalesApiError("sales.empty_cart");
  return apiRequest(`/api/sales/carts/${cart.id}/payment`, access, { method: "POST", body: JSON.stringify({ organizationId: access.organizationId, paymentReference: crypto.randomUUID(), method, amountMinor: cart.totalMinor, currency }) });
}
