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
} from "@/components/ui";
import { transferErrorMessage } from "./error-messages";
import { receiveTransfer } from "./transfers-api";
import type { TransferAccess, TransferItem } from "./types";

type ReceptionDialogProps = Readonly<{
  access: TransferAccess;
  onOpenChange: (open: boolean) => void;
  onReceived: () => void;
  open: boolean;
  transfer: TransferItem;
}>;

export function TransferReceptionDialog({
  access,
  onOpenChange,
  onReceived,
  open,
  transfer,
}: ReceptionDialogProps) {
  const [receiving, setReceiving] = useState(false);
  const [received, setReceived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && received) onReceived();
    onOpenChange(nextOpen);
  }

  async function confirmReception() {
    setReceiving(true);
    setError(null);
    try {
      await receiveTransfer(access, transfer.transferId);
      setReceived(true);
    } catch (receiveError) {
      setError(transferErrorMessage(receiveError));
    } finally {
      setReceiving(false);
    }
  }

  return (
    <Dialog onOpenChange={changeOpen} open={open}>
      <DialogContent>
        {received ? (
          <div className="py-6 text-center">
            <span
              aria-hidden="true"
              className="mx-auto grid size-14 place-items-center rounded-full bg-success/10 text-2xl font-bold text-success"
            >
              ✓
            </span>
            <DialogTitle className="mt-4">Transfert réceptionné</DialogTitle>
            <DialogDescription className="mt-2">
              {transfer.totalQuantity} unités ont été ajoutées au stock de{" "}
              {transfer.destinationShopName}.
            </DialogDescription>
            <Button
              className="mt-6 w-full sm:w-auto"
              onClick={() => changeOpen(false)}
            >
              Retour aux transferts
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Réceptionner le transfert</DialogTitle>
              <DialogDescription>
                {transfer.sourceShopName} → {transfer.destinationShopName}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-[1fr_auto] gap-4 bg-surface-subtle px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  <span>Produit</span>
                  <span>Envoyé</span>
                </div>
                {transfer.lines.map((line) => (
                  <div
                    className="grid grid-cols-[1fr_auto] gap-4 border-t border-border px-4 py-3 text-sm"
                    key={line.productId}
                  >
                    <span>{line.productName}</span>
                    <span className="font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-4 text-sm">
                <span className="font-semibold text-warning">
                  Conséquence :
                </span>{" "}
                ces quantités seront ajoutées au stock de{" "}
                {transfer.destinationShopName}. La réception clôturera
                définitivement le transfert.
              </p>
              {error ? (
                <p className="mt-3 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                disabled={receiving}
                onClick={() => changeOpen(false)}
                variant="secondary"
              >
                Retour
              </Button>
              <Button
                isLoading={receiving}
                onClick={() => void confirmReception()}
              >
                Confirmer la réception
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
