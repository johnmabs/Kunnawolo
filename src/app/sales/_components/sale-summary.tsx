import { formatMoney } from "@/lib/format-money";
import type { SaleCartDto } from "./types";

export function SaleSummary({ cart }: Readonly<{ cart: SaleCartDto }>) {
  const currency = cart.lines[0]?.currency;
  const format = (value: number) =>
    currency ? formatMoney(value, currency) : "—";

  return (
    <dl className="grid gap-2 border-t border-border pt-4 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-text-secondary">Sous-total</dt>
        <dd className="font-medium tabular-nums">
          {format(cart.subtotalMinor)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-text-secondary">Remises</dt>
        <dd className="font-medium tabular-nums text-success">
          − {format(cart.discountMinor)}
        </dd>
      </div>
      <div className="mt-2 flex items-end justify-between gap-4 border-t border-border pt-4">
        <dt className="font-semibold text-text-primary">Total</dt>
        <dd className="text-2xl font-semibold tabular-nums text-text-primary">
          {format(cart.totalMinor)}
        </dd>
      </div>
    </dl>
  );
}
