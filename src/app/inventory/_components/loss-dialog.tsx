"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Textarea,
} from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import type { StockDetail } from "./types";

export function LossDialog({
  busy,
  detail,
  onConfirm,
  onOpenChange,
  open,
}: Readonly<{
  busy: boolean;
  detail: StockDetail;
  onConfirm: (quantity: number, reason: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}>) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const parsedQuantity = Number(quantity);
  const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <Badge className="mb-2 w-fit" variant="warning">
            Opération sensible
          </Badge>
          <DialogTitle>Déclarer une perte</DialogTitle>
          <DialogDescription>{detail.productName}</DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid gap-4">
          <Field label="Quantité perdue" name="lost-quantity" required>
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
          <Field label="Motif" name="loss-reason" required>
            {({ controlId }) => (
              <Textarea
                id={controlId}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Produits endommagés…"
                required
                value={reason}
              />
            )}
          </Field>
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface-subtle p-4 text-sm">
            <dt className="text-text-secondary">Coût de référence</dt>
            <dd className="text-right font-medium">
              {formatMoney(detail.referenceCostMinor, detail.currency)} / unité
            </dd>
            <dt className="text-text-secondary">Valeur estimée</dt>
            <dd className="text-right font-semibold">
              {validQuantity
                ? formatMoney(
                    detail.referenceCostMinor * parsedQuantity,
                    detail.currency,
                  )
                : "—"}
            </dd>
          </dl>
          <p className="text-sm text-text-secondary">
            Cette opération diminuera le stock et restera dans l’historique des
            pertes.
          </p>
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
            disabled={!validQuantity || reason.trim().length === 0 || busy}
            isLoading={busy}
            onClick={() => onConfirm(parsedQuantity, reason.trim())}
            variant="danger"
          >
            Déclarer la perte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
