import { Badge, Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { SalePaymentDto } from "./types";

const methods = { CASH: "Espèces", MOBILE_MONEY: "Mobile Money", BANK_TRANSFER: "Virement bancaire" } as const;

export function SaleSuccess({ onNewSale, payment }: Readonly<{ onNewSale: () => void; payment: SalePaymentDto }>) {
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center p-4 sm:p-8">
      <Card className="w-full max-w-xl p-6 text-center sm:p-10">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-2xl text-success">✓</span>
        <h1 className="mt-5 text-2xl font-semibold text-text-primary">Vente enregistrée</h1>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-text-primary">{formatMoney(payment.amountMinor, payment.currency)}</p>
        <div className="mx-auto mt-6 max-w-xs rounded-lg bg-surface-subtle p-4"><p className="text-xs text-text-secondary">Paiement</p><p className="mt-1 font-semibold">{methods[payment.method]}</p>{payment.businessReference ? <Badge className="mt-3">{payment.businessReference}</Badge> : null}</div>
        <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row"><Button disabled title="BACKEND GAP: SaleDetailProjection" variant="secondary">Voir la vente</Button><Button onClick={onNewSale}>Nouvelle vente</Button></div>
      </Card>
    </div>
  );
}
