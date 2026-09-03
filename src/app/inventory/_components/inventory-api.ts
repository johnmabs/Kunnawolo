import {
  InventoryApiError,
  type InventoryAccess,
  type InventorySessionList,
  type StockDetail,
  type StockList,
} from "./types";

async function request<T>(
  url: string,
  access: InventoryAccess,
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
    throw new InventoryApiError(body.code ?? "inventory.unknown_error");
  return body;
}

function scope(access: InventoryAccess) {
  return new URLSearchParams({
    organizationId: access.organizationId,
    shopId: access.shopId,
  });
}

export function listStock(access: InventoryAccess): Promise<StockList> {
  return request(`/api/inventory/stock?${scope(access).toString()}`, access);
}

export function getStockDetail(
  access: InventoryAccess,
  productId: string,
): Promise<StockDetail> {
  return request(
    `/api/inventory/stock/${productId}?${scope(access).toString()}`,
    access,
  );
}

export function receiveStock(
  access: InventoryAccess,
  productId: string,
  quantity: number,
  externalReference: string,
): Promise<StockDetail> {
  const operationReference = externalReference.trim() || crypto.randomUUID();
  return request(`/api/inventory/stock/${productId}/receipt`, access, {
    method: "POST",
    body: JSON.stringify({
      organizationId: access.organizationId,
      shopId: access.shopId,
      quantity,
      reference: operationReference,
      idempotencyKey: crypto.randomUUID(),
    }),
  });
}

export function recordLoss(
  access: InventoryAccess,
  productId: string,
  quantity: number,
  reason: string,
): Promise<StockDetail> {
  return request(`/api/inventory/stock/${productId}/loss`, access, {
    method: "POST",
    body: JSON.stringify({
      organizationId: access.organizationId,
      shopId: access.shopId,
      quantity,
      reason,
    }),
  });
}

export function updateThreshold(
  access: InventoryAccess,
  productId: string,
  threshold: number,
): Promise<StockDetail> {
  return request(`/api/inventory/stock/${productId}/threshold`, access, {
    method: "PUT",
    body: JSON.stringify({
      organizationId: access.organizationId,
      shopId: access.shopId,
      threshold,
    }),
  });
}

export function listInventorySessions(
  access: InventoryAccess,
): Promise<InventorySessionList> {
  return request(`/api/inventory/sessions?${scope(access).toString()}`, access);
}
