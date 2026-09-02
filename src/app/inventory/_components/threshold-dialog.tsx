"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input } from "@/components/ui";
import type { StockDetail } from "./types";

export function ThresholdDialog({ busy, detail, onConfirm, onOpenChange, open }: Readonly<{ busy: boolean; detail: StockDetail; onConfirm: (threshold: number) => void; onOpenChange: (open: boolean) => void; open: boolean }>) {
  const [threshold, setThreshold] = useState(String(detail.lowStockThreshold));
  const parsedThreshold = Number(threshold);
  const valid = Number.isFinite(parsedThreshold) && parsedThreshold >= 0;
  return (
    <Dialog onOpenChange={onOpenChange} open={open}><DialogContent>
      <DialogHeader><DialogTitle>Modifier le seuil</DialogTitle><DialogDescription>{detail.productName}</DialogDescription></DialogHeader>
      <div className="mt-6"><Field description="Utilisez zéro pour désactiver l’alerte de stock faible." label="Seuil d’alerte" name="low-stock-threshold" required>{({ controlId, descriptionId }) => <Input aria-describedby={descriptionId} autoFocus id={controlId} min={0} onChange={(event) => setThreshold(event.target.value)} required step={1} type="number" value={threshold} />}</Field></div>
      <DialogFooter><Button disabled={busy} onClick={() => onOpenChange(false)} variant="secondary">Annuler</Button><Button disabled={!valid || busy} isLoading={busy} onClick={() => onConfirm(parsedThreshold)}>Enregistrer</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}
