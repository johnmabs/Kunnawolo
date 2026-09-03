"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  EmptyState,
  SearchInput,
  Skeleton,
  useToast,
} from "@/components/ui";
import { transferErrorMessage } from "./error-messages";
import {
  saveTransferLine,
  searchTransferProducts,
  sendTransfer,
} from "./transfers-api";
import type {
  TransferAccess,
  TransferItem,
  TransferLine,
  TransferProduct,
} from "./types";

type DraftDrawerProps = Readonly<{
  access: TransferAccess;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  open: boolean;
  transfer: TransferItem;
}>;

function updateLine(
  lines: readonly TransferLine[],
  product: TransferProduct | TransferLine,
  quantity: number,
): readonly TransferLine[] {
  const isSearchProduct = "id" in product;
  const next: TransferLine = {
    productCode: isSearchProduct ? product.code : product.productCode,
    productId: isSearchProduct ? product.id : product.productId,
    productName: isSearchProduct ? product.name : product.productName,
    quantity,
  };
  return lines.some((line) => line.productId === next.productId)
    ? lines.map((line) => (line.productId === next.productId ? next : line))
    : [...lines, next];
}

export function TransferDraftDrawer({
  access,
  onOpenChange,
  onUpdated,
  open,
  transfer,
}: DraftDrawerProps) {
  const { toast } = useToast();
  const [lines, setLines] = useState(transfer.lines);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly TransferProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void searchTransferProducts(access, normalized)
        .then((response) => {
          if (active)
            setResults(
              response.items.filter((product) => product.trackInventory),
            );
        })
        .catch((searchError: unknown) => {
          if (active) setError(transferErrorMessage(searchError));
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [access, query]);

  const totals = useMemo(
    () => ({
      products: lines.length,
      units: lines.reduce((sum, line) => sum + line.quantity, 0),
    }),
    [lines],
  );

  async function setQuantity(
    product: TransferProduct | TransferLine,
    quantity: number,
  ) {
    if (quantity < 1) return;
    const productId = "id" in product ? product.id : product.productId;
    setSavingProductId(productId);
    setError(null);
    try {
      await saveTransferLine(access, transfer.transferId, productId, quantity);
      setLines((current) => updateLine(current, product, quantity));
      onUpdated();
    } catch (saveError) {
      setError(transferErrorMessage(saveError));
    } finally {
      setSavingProductId(null);
    }
  }

  async function confirmShipment() {
    setSending(true);
    setError(null);
    try {
      await sendTransfer(access, transfer.transferId);
      toast({
        description: `${transfer.sourceShopName} → ${transfer.destinationShopName}`,
        title: "Transfert expédié",
        variant: "success",
      });
      setConfirmSend(false);
      onOpenChange(false);
      onUpdated();
    } catch (sendError) {
      setError(transferErrorMessage(sendError));
      setConfirmSend(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Drawer onOpenChange={onOpenChange} open={open}>
        <DrawerContent className="sm:w-[32rem]">
          <DrawerHeader>
            <DrawerTitle>
              {transfer.sourceShopName} → {transfer.destinationShopName}
            </DrawerTitle>
            <DrawerDescription>
              Préparez les quantités à expédier. Le contrôle du stock est
              réalisé au moment de l’expédition.
            </DrawerDescription>
          </DrawerHeader>

          <div className="mt-6 grid gap-6">
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="transfer-product-search"
              >
                Rechercher un produit
              </label>
              <SearchInput
                autoComplete="off"
                id="transfer-product-search"
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setError(null);
                  if (value.trim().length >= 2) setSearching(true);
                  else {
                    setSearching(false);
                    setResults([]);
                  }
                }}
                placeholder="Nom, code ou code-barres…"
                value={query}
              />
              {searching ? (
                <div className="mt-3 grid gap-2">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              ) : null}
              {!searching && query.trim().length >= 2 ? (
                <div className="mt-3 grid gap-2">
                  {results.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      Aucun produit suivi en stock ne correspond à la recherche.
                    </p>
                  ) : (
                    results.map((product) => {
                      const current = lines.find(
                        (line) => line.productId === product.id,
                      );
                      return (
                        <div
                          className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                          key={product.id}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-text-secondary">
                              {product.code ?? "Sans code"}
                            </p>
                          </div>
                          <Button
                            disabled={savingProductId === product.id}
                            isLoading={savingProductId === product.id}
                            onClick={() =>
                              void setQuantity(
                                product,
                                (current?.quantity ?? 0) + 1,
                              )
                            }
                            size="sm"
                            variant="secondary"
                          >
                            {current ? "Ajouter 1" : "Ajouter"}
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : null}
            </div>

            <section aria-labelledby="transfer-lines-title">
              <h3 className="text-base font-semibold" id="transfer-lines-title">
                Produits à transférer
              </h3>
              <div className="mt-3 grid gap-3">
                {lines.length === 0 ? (
                  <EmptyState
                    description="Recherchez un produit suivi en stock pour commencer."
                    title="Aucun produit"
                  />
                ) : (
                  lines.map((line) => (
                    <article
                      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={line.productId}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {line.productName}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {line.productCode ?? "Sans code"}
                        </p>
                      </div>
                      <div
                        aria-label={`Quantité de ${line.productName}`}
                        className="flex items-center gap-2"
                      >
                        <Button
                          aria-label={`Diminuer ${line.productName}`}
                          disabled={
                            line.quantity <= 1 ||
                            savingProductId === line.productId
                          }
                          onClick={() =>
                            void setQuantity(line, line.quantity - 1)
                          }
                          size="icon"
                          variant="secondary"
                        >
                          −
                        </Button>
                        <output
                          aria-live="polite"
                          className="min-w-10 text-center text-lg font-semibold tabular-nums"
                        >
                          {line.quantity}
                        </output>
                        <Button
                          aria-label={`Augmenter ${line.productName}`}
                          disabled={savingProductId === line.productId}
                          onClick={() =>
                            void setQuantity(line, line.quantity + 1)
                          }
                          size="icon"
                          variant="secondary"
                        >
                          +
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            {error ? (
              <p
                className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div className="rounded-lg bg-surface-subtle p-4 text-sm">
              <span className="font-semibold">
                {totals.products} produit{totals.products > 1 ? "s" : ""}
              </span>
              <span className="mx-2 text-text-secondary">·</span>
              <span>
                {totals.units} unité{totals.units > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <DrawerFooter>
            <Button
              disabled={sending}
              onClick={() => onOpenChange(false)}
              variant="secondary"
            >
              Annuler
            </Button>
            <Button
              disabled={lines.length === 0 || sending}
              onClick={() => setConfirmSend(true)}
            >
              Expédier
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog onOpenChange={setConfirmSend} open={confirmSend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expédier le transfert</DialogTitle>
            <DialogDescription>
              {transfer.sourceShopName} → {transfer.destinationShopName}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 grid gap-3 text-sm">
            <p>
              <strong>
                {totals.products} produit{totals.products > 1 ? "s" : ""}
              </strong>{" "}
              · {totals.units} unité{totals.units > 1 ? "s" : ""}
            </p>
            <p className="rounded-md border border-warning/30 bg-warning/5 p-4 text-text-primary">
              <span className="font-semibold text-warning">Conséquence :</span>{" "}
              le stock de {transfer.sourceShopName} sera diminué des quantités
              expédiées. Le transfert passera en transit et ne pourra plus être
              modifié.
            </p>
          </div>
          <DialogFooter>
            <Button
              disabled={sending}
              onClick={() => setConfirmSend(false)}
              variant="secondary"
            >
              Retour
            </Button>
            <Button isLoading={sending} onClick={() => void confirmShipment()}>
              Confirmer l’expédition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
