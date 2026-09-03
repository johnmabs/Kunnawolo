import {
  CatalogApiError,
  type CatalogAccess,
  type ProductDetail,
  type ProductInput,
  type ProductItem,
  type ProductList,
} from "./types";

async function request<T>(
  url: string,
  access: CatalogAccess,
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
    throw new CatalogApiError(body.code ?? "catalog.unknown_error");
  return body;
}

export function listProducts(
  access: CatalogAccess,
  query = "",
): Promise<ProductList> {
  const search = new URLSearchParams({
    organizationId: access.organizationId,
    query,
    includeInactive: "true",
  });
  return request(`/api/catalog/products?${search}`, access);
}
export function createProduct(
  access: CatalogAccess,
  input: ProductInput,
): Promise<ProductItem> {
  return request("/api/catalog/products", access, {
    method: "POST",
    body: JSON.stringify({ organizationId: access.organizationId, ...input }),
  });
}
export function getProduct(
  access: CatalogAccess,
  productId: string,
): Promise<ProductDetail> {
  return request(
    `/api/catalog/products/${productId}?organizationId=${encodeURIComponent(access.organizationId)}`,
    access,
  );
}
export function setProductActive(
  access: CatalogAccess,
  productId: string,
  isActive: boolean,
): Promise<ProductItem> {
  return request(`/api/catalog/products/${productId}`, access, {
    method: "PATCH",
    body: JSON.stringify({ organizationId: access.organizationId, isActive }),
  });
}
export async function definePricing(
  access: CatalogAccess,
  productId: string,
  input: Readonly<{
    referenceCostMinor: number;
    salePriceMinor: number;
    currency: string;
    reference: string;
  }>,
): Promise<void> {
  await request(`/api/catalog/products/${productId}/pricing`, access, {
    method: "POST",
    body: JSON.stringify({ organizationId: access.organizationId, ...input }),
  });
}
