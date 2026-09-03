"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  ErrorState,
  Skeleton,
  useToast,
} from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import { inventoryErrorMessage } from "./error-messages";
import {
  getStockDetail,
  receiveStock,
  recordLoss,
  updateThreshold,
} from "./inventory-api";
import { LossDialog } from "./loss-dialog";
import { ReceiptDialog } from "./receipt-dialog";
import { ThresholdDialog } from "./threshold-dialog";
import type { InventoryAccess, StockDetail } from "./types";

export function StockDetailDrawer({
  access,
  onChanged,
  onOpenChange,
  productId,
}: Readonly<{
  access: InventoryAccess;
  onChanged: () => void;
  onOpenChange: (open: boolean) => void;
  productId: string;
}>) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);
  const [thresholdOpen, setThresholdOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDetail(await getStockDetail(access, productId));
    } catch (loadError) {
      setError(inventoryErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [access, productId]);

  useEffect(() => {
    let active = true;
    void getStockDetail(access, productId)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(inventoryErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [access, productId]);

  async function operate(
    operation: () => Promise<StockDetail>,
    successMessage: string,
    close: () => void,
  ) {
    setBusy(true);
    try {
      setDetail(await operation());
      close();
      onChanged();
      toast({ title: successMessage, variant: "success" });
    } catch (operationError) {
      toast({
        title: "Opération impossible",
        description: inventoryErrorMessage(operationError),
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer onOpenChange={onOpenChange} open>
      <DrawerContent className="w-[min(32rem,calc(100%-1rem))]">
        {loading ? (
          <div className="grid gap-4 pt-12">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32" />
            <Skeleton className="h-12" />
          </div>
        ) : null}
        {!loading && error ? (
          <div className="pt-12">
            <ErrorState description={error} onRetry={() => void load()} />
          </div>
        ) : null}
        {!loading && detail ? (
          <>
            <DrawerHeader>
              <DrawerTitle>{detail.productName}</DrawerTitle>
              <DrawerDescription>
                {detail.productCode ?? "Sans code produit"}
              </DrawerDescription>
            </DrawerHeader>
            <div className="mt-8 grid gap-4">
              <div className="rounded-lg bg-sidebar p-5 text-white">
                <p className="text-sm text-slate-300">Stock actuel</p>
                <p className="mt-2 text-4xl font-semibold tabular-nums">
                  {detail.quantity}{" "}
                  <span className="text-base font-medium">unités</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-text-secondary">Seuil d’alerte</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">
                    {detail.lowStockThreshold}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-text-secondary">
                    Coût de référence
                  </p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatMoney(detail.referenceCostMinor, detail.currency)}
                  </p>
                </div>
              </div>
              {detail.isLowStock ? (
                <Badge className="w-fit" variant="warning">
                  Stock faible
                </Badge>
              ) : (
                <Badge className="w-fit" variant="success">
                  Stock normal
                </Badge>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button onClick={() => setReceiptOpen(true)}>
                  Réceptionner
                </Button>
                <Button onClick={() => setLossOpen(true)} variant="danger">
                  Déclarer une perte
                </Button>
                <Button
                  className="sm:col-span-2"
                  onClick={() => setThresholdOpen(true)}
                  variant="secondary"
                >
                  Modifier le seuil
                </Button>
              </div>
            </div>
            {receiptOpen ? (
              <ReceiptDialog
                busy={busy}
                detail={detail}
                onConfirm={(quantity, reference) =>
                  void operate(
                    () =>
                      receiveStock(
                        access,
                        detail.productId,
                        quantity,
                        reference,
                      ),
                    "Réception stock enregistrée",
                    () => setReceiptOpen(false),
                  )
                }
                onOpenChange={setReceiptOpen}
                open
              />
            ) : null}
            {lossOpen ? (
              <LossDialog
                busy={busy}
                detail={detail}
                onConfirm={(quantity, reason) =>
                  void operate(
                    () =>
                      recordLoss(access, detail.productId, quantity, reason),
                    "Perte de stock enregistrée",
                    () => setLossOpen(false),
                  )
                }
                onOpenChange={setLossOpen}
                open
              />
            ) : null}
            {thresholdOpen ? (
              <ThresholdDialog
                busy={busy}
                detail={detail}
                onConfirm={(threshold) =>
                  void operate(
                    () => updateThreshold(access, detail.productId, threshold),
                    "Seuil modifié",
                    () => setThresholdOpen(false),
                  )
                }
                onOpenChange={setThresholdOpen}
                open
              />
            ) : null}
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
