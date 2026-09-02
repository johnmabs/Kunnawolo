"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Radio, RadioGroup } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { PaymentMethod, SaleCartDto } from "./types";

const methods: readonly Readonly<{ label: string; value: PaymentMethod }>[] = [
  { label: "Espèces", value: "CASH" },
  { label: "Mobile Money", value: "MOBILE_MONEY" },
  { label: "Virement bancaire", value: "BANK_TRANSFER" },
];

type PaymentDialogProps = Readonly<{
  busy: boolean;
  cart: SaleCartDto;
  onConfirm: (method: PaymentMethod) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>;

export function PaymentDialog({ busy, cart, onConfirm, onOpenChange, open }: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const currency = cart.lines[0]?.currency;
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader><DialogTitle>Paiement</DialogTitle><DialogDescription>Le montant exact de la vente sera enregistré.</DialogDescription></DialogHeader>
        <div className="my-6 rounded-lg bg-sidebar p-6 text-center text-white"><p className="text-xs font-semibold uppercase tracking-wider text-slate-300">À payer</p><p className="mt-2 text-3xl font-semibold tabular-nums">{currency ? formatMoney(cart.totalMinor, currency) : "—"}</p></div>
        <RadioGroup aria-label="Mode de paiement" onValueChange={(value) => setMethod(value as PaymentMethod)} value={method}>
          {methods.map((item) => <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border p-2 pr-4 text-sm font-medium hover:bg-surface-subtle" htmlFor={`payment-${item.value}`} key={item.value}><Radio id={`payment-${item.value}`} value={item.value} />{item.label}</label>)}
        </RadioGroup>
        <DialogFooter><Button disabled={busy} onClick={() => onOpenChange(false)} variant="secondary">Retour</Button><Button disabled={busy} isLoading={busy} onClick={() => onConfirm(method)}>Confirmer le paiement</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
