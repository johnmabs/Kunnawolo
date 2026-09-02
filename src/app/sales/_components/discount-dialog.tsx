"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { SaleLineDto } from "./types";

type DiscountDialogProps = Readonly<{
  busy: boolean;
  line: SaleLineDto | null;
  onApply: (discountMinor: number) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>;

export function DiscountDialog({ busy, line, onApply, onOpenChange, open }: DiscountDialogProps) {
  if (line === null) return null;
  return <DiscountDialogForm busy={busy} key={`${line.id}:${line.discountMinor}`} line={line} onApply={onApply} onOpenChange={onOpenChange} open={open} />;
}

function DiscountDialogForm({ busy, line, onApply, onOpenChange, open }: Omit<DiscountDialogProps, "line"> & Readonly<{ line: SaleLineDto }>) {
  const [discount, setDiscount] = useState(String(line.discountMinor));
  const discountMinor = Number(discount);
  const grossMinor = line.unitPriceMinor * line.quantity;
  const valid = Number.isSafeInteger(discountMinor) && discountMinor >= 0 && discountMinor <= grossMinor;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader><DialogTitle>Appliquer une remise</DialogTitle><DialogDescription>La remise s’applique uniquement à cette ligne.</DialogDescription></DialogHeader>
        <div className="mt-6 grid gap-4">
          <div><p className="text-xs text-text-secondary">Produit</p><p className="font-semibold">{line.productName}</p></div>
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface-subtle p-4 text-sm">
            <dt className="text-text-secondary">Prix</dt><dd className="text-right font-medium">{formatMoney(line.unitPriceMinor, line.currency)}</dd>
            <dt className="text-text-secondary">Quantité</dt><dd className="text-right font-medium">{line.quantity}</dd>
          </dl>
          <Field error={!valid && discount.length > 0 ? "La remise doit être comprise entre zéro et le montant de la ligne." : undefined} label="Remise totale" name="line-discount" required>
            {({ controlId, errorId }) => <div className="relative"><Input aria-describedby={errorId} id={controlId} invalid={!valid} min={0} onChange={(event) => setDiscount(event.target.value)} required step={1} type="number" value={discount} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">{line.currency}</span></div>}
          </Field>
          <div className="rounded-lg border border-border p-4"><p className="text-xs text-text-secondary">Nouveau total</p><p className="mt-1 text-xl font-semibold tabular-nums">{valid ? formatMoney(grossMinor - discountMinor, line.currency) : "—"}</p></div>
        </div>
        <DialogFooter><Button disabled={busy} onClick={() => onOpenChange(false)} variant="secondary">Annuler</Button><Button disabled={!valid || busy} isLoading={busy} onClick={() => onApply(discountMinor)}>Appliquer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
