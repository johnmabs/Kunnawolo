"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer, useWorkspace } from "@/components/layout";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SearchInput,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import { ExpenseDetailDrawer } from "./expense-detail-drawer";
import { expenseErrorMessage } from "./error-messages";
import { listExpenses } from "./expenses-api";
import type { ExpenseAccess, ExpenseFilters, ExpenseItem } from "./types";

const initialFilters: ExpenseFilters = {
  query: "",
  from: "",
  to: "",
  status: "ACTIVE",
};
export function ExpensesWorkspace() {
  const workspace = useWorkspace();
  const access = useMemo<ExpenseAccess>(
    () => ({
      organizationId: workspace.organizationId.trim(),
      shopId: workspace.workspaceShopId.trim(),
    }),
    [workspace.organizationId, workspace.workspaceShopId],
  );
  const ready = Boolean(access.organizationId && access.shopId);
  const [filters, setFilters] = useState(initialFilters);
  const [items, setItems] = useState<readonly ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExpenseItem | null>(null);
  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      setItems((await listExpenses(access, filters)).items);
    } catch (failure) {
      setError(expenseErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [access, filters, ready]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const timer = window.setTimeout(
      () => {
        void listExpenses(access, filters)
          .then((result) => {
            if (active) setItems(result.items);
          })
          .catch((failure: unknown) => {
            if (active) setError(expenseErrorMessage(failure));
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      },
      filters.query ? 250 : 0,
    );
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [access, filters, ready]);
  function change<K extends keyof ExpenseFilters>(
    key: K,
    value: ExpenseFilters[K],
  ) {
    setLoading(true);
    setError(null);
    setFilters((current) => ({ ...current, [key]: value }));
  }
  if (!ready)
    return (
      <PageContainer>
        <EmptyState
          action={
            <Button asChild>
              <Link href="/administration/shops">Gérer les boutiques</Link>
            </Button>
          }
          description="Sélectionnez ou créez une boutique de travail."
          title="Boutique de travail requise"
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <PageHeader
        action={
          <Button disabled title="BACKEND GAP: ExpenseCategoryListProjection">
            + Nouvelle dépense
          </Button>
        }
        description="Consultez les dépenses imputées à la boutique de travail et leurs éventuelles annulations."
        title="Dépenses"
      />
      <p className="mt-3 text-xs text-text-secondary">
        <strong>BACKEND GAP: ExpenseCategoryListProjection</strong> —
        l’enregistrement reste indisponible tant qu’une catégorie active ne peut
        pas être sélectionnée sans identifiant technique.
      </p>
      <div className="mt-6 grid gap-4">
        <SearchInput
          aria-label="Rechercher les dépenses"
          onChange={(event) => change("query", event.target.value)}
          placeholder="Rechercher une description ou une référence…"
          value={filters.query}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Du" name="expense-from">
            {({ controlId }) => (
              <Input
                id={controlId}
                onChange={(event) => change("from", event.target.value)}
                type="date"
                value={filters.from}
              />
            )}
          </Field>
          <Field label="Au" name="expense-to">
            {({ controlId }) => (
              <Input
                id={controlId}
                min={filters.from || undefined}
                onChange={(event) => change("to", event.target.value)}
                type="date"
                value={filters.to}
              />
            )}
          </Field>
        </div>
        <Tabs
          onValueChange={(value) =>
            change("status", value as ExpenseFilters["status"])
          }
          value={filters.status}
        >
          <TabsList aria-label="Filtrer par état">
            <TabsTrigger value="ACTIVE">Actives</TabsTrigger>
            <TabsTrigger value="CANCELLED">Annulées</TabsTrigger>
            <TabsTrigger value="ALL">Toutes</TabsTrigger>
          </TabsList>
        </Tabs>
        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : null}
        {!loading && error ? (
          <ErrorState description={error} onRetry={() => void load()} />
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <EmptyState
            description={
              filters.query ||
              filters.from ||
              filters.to ||
              filters.status !== "ALL"
                ? "Aucun résultat ne correspond aux filtres sélectionnés."
                : "Aucune dépense n’existe pour cette boutique."
            }
            title="Aucune dépense"
          />
        ) : null}
        {!loading && !error && items.length ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-border bg-surface lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-subtle text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Catégorie</th>
                    <th className="px-4 py-3">Boutique</th>
                    <th className="px-4 py-3 text-right">Montant</th>
                    <th className="px-4 py-3">État</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((expense) => (
                    <tr
                      className="cursor-pointer border-t border-border hover:bg-surface-subtle"
                      key={expense.id}
                      onClick={() => setSelected(expense)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          setSelected(expense);
                      }}
                    >
                      <td className="px-4 py-4">
                        {new Date(expense.occurredAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {expense.description}
                      </td>
                      <td className="px-4 py-4">{expense.categoryName}</td>
                      <td className="px-4 py-4">Boutique de travail</td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums">
                        {formatMoney(expense.amountMinor, expense.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={expense.cancellation ? "danger" : "success"}
                        >
                          {expense.cancellation ? "Annulée" : "Active"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {items.map((expense) => (
                <button
                  className="min-h-28 rounded-lg border border-border bg-surface p-4 text-left"
                  key={expense.id}
                  onClick={() => setSelected(expense)}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-semibold">
                        {expense.description}
                      </span>
                      <span className="mt-1 block text-sm text-text-secondary">
                        {expense.categoryName} ·{" "}
                        {new Date(expense.occurredAt).toLocaleDateString(
                          "fr-FR",
                        )}
                      </span>
                      <span className="mt-2 block font-semibold tabular-nums">
                        {formatMoney(expense.amountMinor, expense.currency)}
                      </span>
                    </span>
                    <Badge
                      variant={expense.cancellation ? "danger" : "success"}
                    >
                      {expense.cancellation ? "Annulée" : "Active"}
                    </Badge>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {selected ? (
        <ExpenseDetailDrawer
          access={access}
          expense={selected}
          key={selected.id}
          onChanged={() => void load()}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </PageContainer>
  );
}
