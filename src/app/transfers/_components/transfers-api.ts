import { TransferApiError, type TransferAccess, type TransferList, type TransferProductSearch } from "./types";

async function request<T>(url: string, access: TransferAccess, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await response.json() as T & Readonly<{ code?: string }>;
  if (!response.ok) throw new TransferApiError(body.code ?? "transfers.unknown_error");
  return body;
}

export function listTransfers(access: TransferAccess): Promise<TransferList> {
  const search = new URLSearchParams({ organizationId: access.organizationId, shopId: access.shopId });
  return request(`/api/transfers?${search.toString()}`, access);
}

export function searchTransferProducts(access: TransferAccess, query: string): Promise<TransferProductSearch> {
  const search = new URLSearchParams({ organizationId: access.organizationId, query });
  return request(`/api/catalog/products?${search.toString()}`, access);
}

export async function saveTransferLine(access: TransferAccess, transferId: string, productId: string, quantity: number): Promise<void> {
  await request(`/api/transfers/${transferId}/lines`, access, {
    method: "PUT",
    body: JSON.stringify({ organizationId: access.organizationId, productId, quantity }),
  });
}

export async function sendTransfer(access: TransferAccess, transferId: string): Promise<void> {
  await request(`/api/transfers/${transferId}/shipment`, access, {
    method: "POST",
    body: JSON.stringify({ organizationId: access.organizationId, reference: crypto.randomUUID() }),
  });
}

export async function receiveTransfer(access: TransferAccess, transferId: string): Promise<void> {
  await request(`/api/transfers/${transferId}/reception`, access, {
    method: "POST",
    body: JSON.stringify({ organizationId: access.organizationId, reference: crypto.randomUUID() }),
  });
}
