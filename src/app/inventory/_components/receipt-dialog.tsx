"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
} from "@/components/ui";
import type { StockDetail } from "./types";

export function ReceiptDialog({
  busy,
  detail,
  onConfirm,
  onOpenChange,
  open,
}: Readonly<{
  busy: boolean;
  detail: StockDetail;
  onConfirm: (quantity: number, reference: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>) {
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const parsedQuantity = Number(quantity);
  const valid = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réceptionner du stock</DialogTitle>
          <DialogDescription>{detail.productName}</DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid gap-4">
          <div className="rounded-lg bg-surface-subtle p-4">
            <p className="text-xs text-text-secondary">Stock actuel</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {detail.quantity}
            </p>
          </div>
          <Field label="Quantité reçue" name="received-quantity" required>
            {({ controlId }) => (
              <Input
                autoFocus
                id={controlId}
                min={1}
                onChange={(event) => setQuantity(event.target.value)}
                required
                step={1}
                type="number"
                value={quantity}
              />
            )}
          </Field>
          <Field
            description="Facultative pour l’utilisateur ; une référence technique sera conservée dans tous les cas."
            label="Référence externe"
            name="receipt-reference"
          >
            {({ controlId, descriptionId }) => (
              <Input
                aria-describedby={descriptionId}
                id={controlId}
                onChange={(event) => setReference(event.target.value)}
                value={reference}
              />
            )}
          </Field>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-text-secondary">Après réception</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {valid ? detail.quantity + parsedQuantity : "—"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={busy}
            onClick={() => onOpenChange(false)}
            variant="secondary"
          >
            Annuler
          </Button>
          <Button
            disabled={!valid || busy}
            isLoading={busy}
            onClick={() => onConfirm(parsedQuantity, reference)}
          >
            Réceptionner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
