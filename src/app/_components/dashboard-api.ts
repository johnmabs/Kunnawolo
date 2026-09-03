import {
  DashboardApiError,
  type Dashboard,
  type DashboardAccess,
  type DashboardFilters,
} from "./dashboard-types";

function parameters(access: DashboardAccess, filters: DashboardFilters) {
  const search = new URLSearchParams({ organizationId: access.organizationId });
  if (filters.shopId) search.set("shopId", filters.shopId);
  if (filters.from) search.set("occurredFrom", `${filters.from}T00:00:00.000Z`);
  if (filters.to) search.set("occurredTo", `${filters.to}T23:59:59.999Z`);
  return search;
}

export async function loadDashboard(
  access: DashboardAccess,
  filters: DashboardFilters,
): Promise<Dashboard> {
  const response = await fetch(
    `/api/reports/dashboard?${parameters(access, filters)}`,
    { cache: "no-store" },
  );
  const body = (await response.json()) as Dashboard &
    Readonly<{ code?: string }>;
  if (!response.ok)
    throw new DashboardApiError(body.code ?? "reporting.dashboard_failed");
  return body;
}

export async function exportDashboard(
  access: DashboardAccess,
  filters: DashboardFilters,
): Promise<void> {
  const response = await fetch("/api/reports/dashboard/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organizationId: access.organizationId,
      shopId: filters.shopId,
      occurredFrom: filters.from ? `${filters.from}T00:00:00.000Z` : null,
      occurredTo: filters.to ? `${filters.to}T23:59:59.999Z` : null,
      reference: crypto.randomUUID(),
    }),
  });
  if (!response.ok) {
    const body = (await response.json()) as Readonly<{ code?: string }>;
    throw new DashboardApiError(body.code ?? "reporting.export_failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tableau-de-bord-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const messages: Readonly<Record<string, string>> = {
  "reporting.read_forbidden":
    "Seuls les propriétaires et responsables autorisés peuvent consulter le reporting.",
  "reporting.invalid_date_range": "La période sélectionnée est invalide.",
  "reporting.shop_not_found": "La boutique sélectionnée n’existe plus.",
  "security.invalid_api_key": "La clé d’accès est invalide ou révoquée.",
};
export function dashboardErrorMessage(error: unknown) {
  return error instanceof DashboardApiError
    ? (messages[error.code] ?? `Une erreur est survenue (${error.code}).`)
    : "Une erreur inattendue est survenue.";
}
