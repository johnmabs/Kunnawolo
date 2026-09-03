import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { SaleLineDto } from "./types";

type SaleCartLineProps = Readonly<{
  busy: boolean;
  line: SaleLineDto;
  onDiscount: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}>;

export function SaleCartLine({
  busy,
  line,
  onDiscount,
  onQuantityChange,
  onRemove,
}: SaleCartLineProps) {
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-text-primary">
            {line.productName}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {formatMoney(line.unitPriceMinor, line.currency)} / unité
          </p>
        </div>
        <Button
          aria-label={`Retirer ${line.productName}`}
          disabled={busy}
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          ×
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div
          aria-label={`Quantité de ${line.productName}`}
          className="flex items-center rounded-md border border-border"
          role="group"
        >
          <Button
            aria-label="Diminuer la quantité"
            className="rounded-r-none border-0"
            disabled={busy || line.quantity <= 1}
            onClick={() => onQuantityChange(line.quantity - 1)}
            size="icon"
            variant="ghost"
          >
            −
          </Button>
          <span
            className="min-w-10 text-center font-semibold tabular-nums"
            aria-live="polite"
          >
            {line.quantity}
          </span>
          <Button
            aria-label="Augmenter la quantité"
            className="rounded-l-none border-0"
            disabled={busy}
            onClick={() => onQuantityChange(line.quantity + 1)}
            size="icon"
            variant="ghost"
          >
            +
          </Button>
        </div>
        <p className="font-semibold tabular-nums text-text-primary">
          {formatMoney(line.lineTotalMinor, line.currency)}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <Button disabled={busy} onClick={onDiscount} variant="ghost">
          {line.discountMinor > 0
            ? "Modifier la remise"
            : "Appliquer une remise"}
        </Button>
        {line.discountMinor > 0 ? (
          <span className="text-sm font-medium text-success">
            − {formatMoney(line.discountMinor, line.currency)}
          </span>
        ) : null}
      </div>
    </li>
  );
}
