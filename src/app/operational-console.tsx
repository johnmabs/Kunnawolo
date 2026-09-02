"use client";

import { useRef, useState } from "react";
import { AppShell, PageContainer } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, KpiCard, PageHeader, Switch } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";

type Dashboard = Readonly<{
  estimatedResult?: Readonly<{ amount?: Readonly<{ amountMinor?: number }> }>;
  sales?: Readonly<{
    grossMargin?: Readonly<{ amountMinor?: number }>;
    revenue?: Readonly<{ amountMinor?: number; currency?: string }>;
  }>;
  stock?: Readonly<{
    anomalyCount?: number;
    onHandQuantity?: Readonly<{ value?: number }>;
  }>;
}>;

type ApiError = Readonly<{ code?: string }>;

export function OperationalConsole() {
  const [organizationId, setOrganizationId] = useState("");
  const [workspaceShopId, setWorkspaceShopId] = useState("");
  const [dashboardShopId, setDashboardShopId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [compact, setCompact] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [message, setMessage] = useState("Renseignez votre accès pour consulter les indicateurs.");
  const [busy, setBusy] = useState(false);
  const preferenceRequestKey = useRef(crypto.randomUUID());

  const canSubmit = organizationId.trim().length > 0 && apiKey.trim().length > 0;
  const headers = { Authorization: `Bearer ${apiKey}` };
  const currency = dashboard?.sales?.revenue?.currency;

  async function loadDashboard() {
    setBusy(true);
    setMessage("Chargement des indicateurs…");
    const search = new URLSearchParams({ organizationId: organizationId.trim() });
    if (dashboardShopId.trim().length > 0) search.set("shopId", dashboardShopId.trim());

    try {
      const response = await fetch(`/api/reports/dashboard?${search.toString()}`, { headers, cache: "no-store" });
      const body = await response.json() as Dashboard & ApiError;
      if (!response.ok) {
        setDashboard(null);
        setMessage(`Impossible de charger les indicateurs (${body.code ?? "erreur"}).`);
        return;
      }
      setDashboard(body);
      setMessage("Indicateurs à jour.");
    } catch {
      setDashboard(null);
      setMessage("Impossible de joindre le service des indicateurs.");
    } finally {
      setBusy(false);
    }
  }

  async function savePreference() {
    setBusy(true);
    try {
      const response = await fetch("/api/workspace-preference", {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json", "Idempotency-Key": preferenceRequestKey.current },
        body: JSON.stringify({ organizationId: organizationId.trim(), shopId: workspaceShopId.trim() || null, isCompact: compact }),
      });
      const body = await response.json() as ApiError;
      if (response.ok) preferenceRequestKey.current = crypto.randomUUID();
      setMessage(response.ok ? "Préférence de poste enregistrée." : `Impossible d’enregistrer la préférence (${body.code ?? "erreur"}).`);
    } catch {
      setMessage("Impossible de joindre le service des préférences.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      organizationLabel={organizationId.trim() ? `ID : ${organizationId.trim()}` : "Non sélectionnée"}
      shopLabel={workspaceShopId.trim() ? `ID : ${workspaceShopId.trim()}` : "Boutique non définie"}
      userLabel="Identité indisponible"
    >
      <PageContainer className={compact ? "lg:p-6" : undefined}>
        <PageHeader description="Consultez les principaux indicateurs commerciaux dans le périmètre analytique choisi." title="Tableau de bord" />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Accès et contexte de travail</CardTitle>
            <p className="text-sm text-text-secondary">Les sélecteurs nommés seront disponibles après ajout des projections Organisation, Utilisateur et Boutiques.</p>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Organisation" name="organization-id" required>
                {({ controlId, descriptionId, errorId }) => <Input aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} autoComplete="organization" id={controlId} onChange={(event) => setOrganizationId(event.target.value)} required value={organizationId} />}
              </Field>
              <Field label="Clé d’accès" name="api-key" required>
                {({ controlId, descriptionId, errorId }) => <Input aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} autoComplete="current-password" id={controlId} onChange={(event) => setApiKey(event.target.value)} required type="password" value={apiKey} />}
              </Field>
            </div>

            <div className="grid gap-4 border-t border-border pt-5 lg:grid-cols-2">
              <Field description="Contexte opérationnel utilisé pour les ventes et opérations de stock." label="Boutique de travail" name="workspace-shop-id">
                {({ controlId, descriptionId, errorId }) => <Input aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} autoComplete="off" id={controlId} onChange={(event) => setWorkspaceShopId(event.target.value)} placeholder="Identifiant de boutique" value={workspaceShopId} />}
              </Field>
              <Field description="Laissez vide pour consulter toute l’organisation. Ce filtre ne change pas la boutique de travail." label="Boutique du rapport" name="dashboard-shop-id">
                {({ controlId, descriptionId, errorId }) => <Input aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined} autoComplete="off" id={controlId} onChange={(event) => setDashboardShopId(event.target.value)} placeholder="Toute l’organisation" value={dashboardShopId} />}
              </Field>
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-text-primary" htmlFor="compact-mode">
                <Switch checked={compact} id="compact-mode" onCheckedChange={setCompact} />
                Affichage compact
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button disabled={!canSubmit} isLoading={busy} onClick={loadDashboard}>Actualiser les indicateurs</Button>
                <Button disabled={!canSubmit} isLoading={busy} onClick={savePreference} variant="secondary">Enregistrer ce poste</Button>
              </div>
            </div>
            <p aria-live="polite" className="min-h-5 text-sm text-text-secondary" role="status">{message}</p>
          </CardContent>
        </Card>

        <section aria-label="Indicateurs du périmètre analytique" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Chiffre d’affaires" value={formatMetric(dashboard?.sales?.revenue?.amountMinor, currency)} />
          <KpiCard label="Marge brute" value={formatMetric(dashboard?.sales?.grossMargin?.amountMinor, currency)} />
          <KpiCard label="Stock disponible" value={formatMetric(dashboard?.stock?.onHandQuantity?.value)} />
          <KpiCard label="Anomalies" value={formatMetric(dashboard?.stock?.anomalyCount)} />
          <KpiCard label="Résultat estimé" value={formatMetric(dashboard?.estimatedResult?.amount?.amountMinor, currency)} />
        </section>
      </PageContainer>
    </AppShell>
  );
}

function formatMetric(value: number | undefined, currency?: string): string {
  if (value === undefined) return "—";
  return currency ? formatMoney(value, currency) : value.toLocaleString("fr-FR");
}
