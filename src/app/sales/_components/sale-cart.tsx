import { Button, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import { SaleCartLine } from "./sale-cart-line";
import { SaleSummary } from "./sale-summary";
import type { SaleCartDto, SaleLineDto } from "./types";

type SaleCartProps = Readonly<{
  busyLineId: string | null;
  cart: SaleCartDto;
  onDiscount: (line: SaleLineDto) => void;
  onFinalize: () => void;
  onQuantityChange: (line: SaleLineDto, quantity: number) => void;
  onRemove: (line: SaleLineDto) => void;
}>;

export function SaleCart({
  busyLineId,
  cart,
  onDiscount,
  onFinalize,
  onQuantityChange,
  onRemove,
}: SaleCartProps) {
  const currency = cart.lines[0]?.currency;

  return (
    <section
      aria-labelledby="sale-cart-title"
      className="flex min-h-0 flex-col border-t border-border bg-surface lg:border-l lg:border-t-0"
    >
      <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
        <h2
          className="text-base font-semibold text-text-primary"
          id="sale-cart-title"
        >
          Panier
        </h2>
        <span className="text-sm text-text-secondary">
          {cart.lines.length} {cart.lines.length > 1 ? "articles" : "article"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {cart.lines.length === 0 ? (
          <EmptyState
            description="Recherchez un produit pour commencer."
            title="Votre panier est vide"
          />
        ) : (
          <ul className="grid gap-3">
            {cart.lines.map((line) => (
              <SaleCartLine
                busy={busyLineId !== null}
                key={line.id}
                line={line}
                onDiscount={() => onDiscount(line)}
                onQuantityChange={(quantity) =>
                  onQuantityChange(line, quantity)
                }
                onRemove={() => onRemove(line)}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="sticky bottom-0 z-10 border-t border-border bg-surface p-4 shadow-[0_-8px_20px_-16px_rgba(15,23,42,0.35)] sm:p-6 lg:static lg:shadow-none">
        <SaleSummary cart={cart} />
        <Button
          className="mt-5 w-full"
          disabled={cart.lines.length === 0 || busyLineId !== null}
          onClick={onFinalize}
          size="lg"
        >
          {currency
            ? `Finaliser — ${formatMoney(cart.totalMinor, currency)}`
            : "Finaliser"}
        </Button>
      </div>
    </section>
  );
}
