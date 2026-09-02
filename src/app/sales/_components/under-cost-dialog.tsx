"use client";

import { useState } from "react";
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Textarea } from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { SaleLineDto } from "./types";

type UnderCostDialogProps = Readonly<{
  lines: readonly SaleLineDto[];
  onContinue: (reason: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>;

export function UnderCostDialog({ lines, onContinue, onOpenChange, open }: UnderCostDialogProps) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length > 0;
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setReason("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader><Badge className="mb-2 w-fit" variant="warning">Opération sensible</Badge><DialogTitle>Vente sous le coût de référence</DialogTitle><DialogDescription>La remise place {lines.length > 1 ? `${lines.length} lignes` : "cette ligne"} sous le coût enregistré.</DialogDescription></DialogHeader>
        <div className="mt-6 grid gap-3">
          {lines.map((line) => (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4" key={line.id}>
              <p className="font-semibold">{line.productName}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-text-secondary">Prix après remise</dt><dd className="text-right font-medium">{formatMoney(line.lineTotalMinor, line.currency)}</dd>
                <dt className="text-text-secondary">Coût de référence</dt><dd className="text-right font-medium">{formatMoney(line.unitCostMinor * line.quantity, line.currency)}</dd>
                <dt className="text-text-secondary">Écart</dt><dd className="text-right font-semibold text-danger">{formatMoney(line.lineTotalMinor - line.unitCostMinor * line.quantity, line.currency)}</dd>
              </dl>
            </div>
          ))}
          <Field label="Justification" name="under-cost-reason" required>
            {({ controlId }) => <Textarea id={controlId} onChange={(event) => setReason(event.target.value)} placeholder="Expliquez pourquoi cette vente doit continuer…" required value={reason} />}
          </Field>
        </div>
        <DialogFooter><Button onClick={() => handleOpenChange(false)} variant="secondary">Retour</Button><Button disabled={!valid} onClick={() => { onContinue(reason.trim()); setReason(""); }}>Continuer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
