"use client";
import { useMemo, useState } from "react";
import { PageContainer, useWorkspace } from "@/components/layout";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  useToast,
} from "@/components/ui";
import {
  dashboardErrorMessage,
  exportDashboard,
  loadDashboard,
} from "./dashboard-api";
import { DashboardResults } from "./dashboard-results";
import type { Dashboard, DashboardFilters } from "./dashboard-types";
import { WorkspaceSettings } from "./workspace-settings";

export function DashboardWorkspace() {
  const { compact, organizationId, workspaceShopId } = useWorkspace();
  const { toast } = useToast();
  const access = useMemo(
    () => ({ organizationId: organizationId.trim() }),
    [organizationId],
  );
  const ready = Boolean(access.organizationId);
  const [scope, setScope] = useState<"organization" | "workspace">(
    "organization",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filters: DashboardFilters = {
    shopId: scope === "workspace" ? workspaceShopId.trim() || null : null,
    from,
    to,
  };
  const validFilters =
    !(from && to && from > to) &&
    (scope === "organization" || Boolean(filters.shopId));
  async function refresh() {
    if (!ready || !validFilters) return;
    setLoading(true);
    setError(null);
    try {
      setDashboard(await loadDashboard(access, filters));
    } catch (failure) {
      setDashboard(null);
      setError(dashboardErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }
  async function download() {
    if (!dashboard) return;
    setExporting(true);
    try {
      await exportDashboard(access, filters);
      toast({ title: "Export CSV préparé", variant: "success" });
    } catch (failure) {
      toast({
        title: "Export impossible",
        description: dashboardErrorMessage(failure),
        variant: "error",
      });
    } finally {
      setExporting(false);
    }
  }
  return (
    <PageContainer className={compact ? "lg:p-6" : undefined}>
      <PageHeader
        action={
          <Button
            disabled={!dashboard || loading}
            isLoading={exporting}
            onClick={() => void download()}
            variant="secondary"
          >
            Exporter CSV
          </Button>
        }
        description="Suivez l’activité commerciale dans un périmètre analytique indépendant de la boutique de travail."
        title="Tableau de bord"
      />
      {!ready ? (
        <div className="mt-6 grid gap-6">
          <WorkspaceSettings />
          <EmptyState
            description="Configurez l’organisation et la clé d’accès pour afficher les indicateurs."
            title="Accès au reporting requis"
          />
        </div>
      ) : (
        <>
          <section
            aria-label="Filtres du tableau de bord"
            className="mt-6 grid gap-4 rounded-lg border border-border bg-surface p-4 sm:p-6 lg:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Field label="Périmètre" name="dashboard-scope">
              {({ controlId }) => (
                <Select
                  onValueChange={(value) => {
                    setScope(value as "organization" | "workspace");
                    setDashboard(null);
                  }}
                  value={scope}
                >
                  <SelectTrigger id={controlId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">
                      Toute l’organisation
                    </SelectItem>
                    <SelectItem
                      disabled={!workspaceShopId.trim()}
                      value="workspace"
                    >
                      Boutique de travail
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
            <Field
              error={
                from && to && from > to
                  ? "La date de début doit précéder la date de fin."
                  : undefined
              }
              label="Du"
              name="dashboard-from"
            >
              {({ controlId, errorId }) => (
                <Input
                  aria-describedby={errorId}
                  id={controlId}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setDashboard(null);
                  }}
                  type="date"
                  value={from}
                />
              )}
            </Field>
            <Field label="Au" name="dashboard-to">
              {({ controlId }) => (
                <Input
                  id={controlId}
                  min={from || undefined}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setDashboard(null);
                  }}
                  type="date"
                  value={to}
                />
              )}
            </Field>
            <Button
              className="self-end"
              disabled={!validFilters}
              isLoading={loading}
              onClick={() => void refresh()}
            >
              Actualiser
            </Button>
          </section>
          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : null}
          {!loading && error ? (
            <ErrorState
              className="mt-6"
              description={error}
              onRetry={() => void refresh()}
            />
          ) : null}
          {!loading && !error && dashboard ? (
            <DashboardResults dashboard={dashboard} />
          ) : null}
          {!loading && !error && !dashboard ? (
            <EmptyState
              className="mt-6"
              description="Choisissez le périmètre et la période, puis actualisez les indicateurs."
              title="Indicateurs à charger"
            />
          ) : null}
          <details className="mt-8">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-text-secondary">
              Configuration du poste
            </summary>
            <WorkspaceSettings />
          </details>
        </>
      )}
    </PageContainer>
  );
}
