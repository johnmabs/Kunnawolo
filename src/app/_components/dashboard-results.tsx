import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  KpiCard,
  SectionHeader,
} from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { Dashboard } from "./dashboard-types";

export function DashboardResults({
  dashboard,
}: Readonly<{ dashboard: Dashboard }>) {
  const currency = dashboard.sales.revenue.currency;
  const money = (value: number) => formatMoney(value, currency);
  const quantity = (value: number) => value.toLocaleString("fr-FR");
  return (
    <div className="mt-6 grid gap-6">
      <section
        aria-label="Indicateurs commerciaux"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Chiffre d’affaires"
          value={money(dashboard.sales.revenue.amountMinor)}
        />
        <KpiCard
          label="Marge brute"
          value={money(dashboard.sales.grossMargin.amountMinor)}
        />
        <KpiCard label="Ventes" value={quantity(dashboard.sales.saleCount)} />
        <KpiCard
          label="Résultat estimé"
          value={money(dashboard.estimatedResult.amount.amountMinor)}
        />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <Metric
                label="Disponible"
                value={`${quantity(dashboard.stock.onHandQuantity.value)} unités`}
              />
              <Metric
                label="En transit"
                value={`${quantity(dashboard.stock.inTransitQuantity.value)} unités`}
              />
              <Metric
                label="Pertes"
                value={`${quantity(dashboard.stock.lossQuantity.value)} unités`}
              />
              <Metric
                label="Anomalies"
                value={quantity(dashboard.stock.anomalyCount)}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Résultat estimé</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <Metric
                label="Marge brute"
                value={money(dashboard.estimatedResult.grossMargin.amountMinor)}
              />
              <Metric
                label="− Dépenses actives"
                value={money(
                  dashboard.estimatedResult.activeExpenses.amountMinor,
                )}
              />
              <Metric
                label="− Pertes valorisées"
                value={money(
                  dashboard.estimatedResult.valuedLosses.amountMinor,
                )}
              />
              <div className="border-t border-border pt-4">
                <Metric
                  label="= Résultat estimé"
                  strong
                  value={money(dashboard.estimatedResult.amount.amountMinor)}
                />
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <SectionHeader
        description="Les indicateurs utilisent uniquement les ventes finalisées et les écritures actives du périmètre."
        title="Méthode de calcul"
      />
    </div>
  );
}
function Metric({
  label,
  strong = false,
  value,
}: Readonly<{ label: string; strong?: boolean; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-semibold" : "text-text-secondary"}>
        {label}
      </dt>
      <dd
        className={
          strong
            ? "text-lg font-semibold tabular-nums"
            : "font-medium tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
