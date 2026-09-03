"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { PageContainer, useWorkspace } from "@/components/layout";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  useToast,
} from "@/components/ui";
import { formatMoney } from "@/lib/format-money";
import { DiscountDialog } from "./discount-dialog";
import { FinalizeDialog } from "./finalize-dialog";
import { PaymentDialog } from "./payment-dialog";
import { ProductSearch } from "./product-search";
import { SaleCart } from "./sale-cart";
import { SaleSuccess } from "./sale-success";
import { UnderCostDialog } from "./under-cost-dialog";
import { salesErrorMessage } from "./error-messages";
import {
  addLine,
  createCart,
  finalizeCart,
  paySale,
  removeLine,
  updateLine,
} from "./sales-api";
import type {
  PaymentMethod,
  ProductSearchItem,
  SaleCartDto,
  SaleLineDto,
  SalePaymentDto,
} from "./types";

export function SalesWorkspace() {
  const { organizationId, workspaceShopId } = useWorkspace();
  const { toast } = useToast();
  const access = useMemo(
    () => ({ organizationId: organizationId.trim() }),
    [organizationId],
  );
  const ready =
    access.organizationId.length > 0 && workspaceShopId.trim().length > 0;
  const [cart, setCart] = useState<SaleCartDto | null>(null);
  const [payment, setPayment] = useState<SalePaymentDto | null>(null);
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [busyLineId, setBusyLineId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<SaleLineDto | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [underCostOpen, setUnderCostOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [underCostReason, setUnderCostReason] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [finalized, setFinalized] = useState(false);

  const startSale = useCallback(async () => {
    if (!ready) return;
    setLoadingCart(true);
    setCart(null);
    setCartError(null);
    setPayment(null);
    setFinalized(false);
    setUnderCostReason(null);
    try {
      setCart(await createCart(access, workspaceShopId.trim()));
    } catch (error) {
      setCartError(salesErrorMessage(error));
    } finally {
      setLoadingCart(false);
    }
  }, [access, ready, workspaceShopId]);

  async function runCartOperation(
    key: string,
    operation: () => Promise<SaleCartDto>,
  ) {
    setBusyLineId(key);
    try {
      setCart(await operation());
    } catch (error) {
      toast({
        title: "Opération impossible",
        description: salesErrorMessage(error),
        variant: "error",
      });
    } finally {
      setBusyLineId(null);
    }
  }

  function handleAdd(product: ProductSearchItem) {
    if (!cart) return;
    const existing = cart.lines.find((line) => line.productId === product.id);
    if (existing) {
      void runCartOperation(product.id, () =>
        updateLine(access, cart.id, {
          lineId: existing.id,
          productId: existing.productId,
          quantity: existing.quantity + 1,
          discountMinor: existing.discountMinor,
        }),
      );
      return;
    }
    void runCartOperation(product.id, () =>
      addLine(access, cart.id, product.id),
    );
  }

  function handleUpdate(
    line: SaleLineDto,
    quantity: number,
    discountMinor = line.discountMinor,
  ) {
    if (!cart) return;
    void runCartOperation(line.id, () =>
      updateLine(access, cart.id, {
        lineId: line.id,
        productId: line.productId,
        quantity,
        discountMinor,
      }),
    );
  }

  function requestFinalization() {
    if (!cart) return;
    if (cart.lines.some((line) => line.isBelowCost)) setUnderCostOpen(true);
    else setFinalizeOpen(true);
  }

  async function confirmFinalization() {
    if (!cart) return;
    setCheckoutBusy(true);
    try {
      await finalizeCart(access, cart.id, underCostReason);
      setFinalizeOpen(false);
      setFinalized(true);
      setPaymentOpen(true);
    } catch (error) {
      toast({
        title: "Finalisation impossible",
        description: salesErrorMessage(error),
        variant: "error",
      });
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function confirmPayment(method: PaymentMethod) {
    if (!cart) return;
    setCheckoutBusy(true);
    try {
      const recordedPayment = await paySale(access, cart, method);
      setPayment(recordedPayment);
      setPaymentOpen(false);
    } catch (error) {
      toast({
        title: "Paiement impossible",
        description: salesErrorMessage(error),
        variant: "error",
      });
    } finally {
      setCheckoutBusy(false);
    }
  }

  if (!ready) {
    return (
      <PageContainer>
        <EmptyState
          action={
            <Button asChild>
              <Link href="/administration/shops">Gérer les boutiques</Link>
            </Button>
          }
          description="Sélectionnez une boutique de travail pour commencer une vente."
          title="Boutique de travail requise"
        />
      </PageContainer>
    );
  }

  if (payment)
    return <SaleSuccess onNewSale={() => void startSale()} payment={payment} />;

  if (loadingCart) {
    return (
      <PageContainer>
        <div className="grid min-h-[60dvh] place-items-center" role="status">
          <p className="text-sm text-text-secondary">
            Préparation d’une nouvelle vente…
          </p>
        </div>
      </PageContainer>
    );
  }

  if (cartError) {
    return (
      <PageContainer>
        <ErrorState
          description={cartError}
          onRetry={() => void startSale()}
          title="Impossible de commencer la vente"
        />
      </PageContainer>
    );
  }

  if (!cart) {
    return (
      <PageContainer>
        <EmptyState
          action={
            <Button onClick={() => void startSale()}>
              Commencer une vente
            </Button>
          }
          description="Un nouveau panier sera créé pour la boutique de travail actuelle."
          title="Prêt pour une nouvelle vente"
        />
      </PageContainer>
    );
  }

  if (finalized) {
    const currency = cart.lines[0]?.currency;
    return (
      <PageContainer>
        <Card className="mx-auto max-w-xl p-6 text-center sm:p-10">
          <h1 className="text-2xl font-semibold">Vente finalisée</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Les articles ont été sortis du stock. Le paiement doit maintenant
            être enregistré.
          </p>
          <p className="mt-6 text-3xl font-semibold tabular-nums">
            {currency ? formatMoney(cart.totalMinor, currency) : "—"}
          </p>
          <Button className="mt-8" onClick={() => setPaymentOpen(true)}>
            Enregistrer le paiement
          </Button>
        </Card>
        <PaymentDialog
          busy={checkoutBusy}
          cart={cart}
          onConfirm={(method) => void confirmPayment(method)}
          onOpenChange={setPaymentOpen}
          open={paymentOpen}
        />
      </PageContainer>
    );
  }

  const underCostLines = cart.lines.filter((line) => line.isBelowCost);
  return (
    <PageContainer>
      <PageHeader
        description="Recherchez, ajoutez et encaissez sans quitter cet écran."
        eyebrow={`Boutique ID : ${workspaceShopId.trim()}`}
        title="Nouvelle vente"
      />
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface lg:grid lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[minmax(0,1fr)_28rem]">
        <ProductSearch
          access={access}
          busyProductId={busyLineId}
          onAdd={handleAdd}
        />
        <SaleCart
          busyLineId={busyLineId}
          cart={cart}
          onDiscount={(line) => {
            setSelectedLine(line);
            setDiscountOpen(true);
          }}
          onFinalize={requestFinalization}
          onQuantityChange={handleUpdate}
          onRemove={(line) =>
            void runCartOperation(line.id, () =>
              removeLine(access, cart.id, line.id),
            )
          }
        />
      </div>
      <DiscountDialog
        busy={busyLineId !== null}
        line={selectedLine}
        onApply={(discountMinor) => {
          if (selectedLine)
            handleUpdate(selectedLine, selectedLine.quantity, discountMinor);
          setDiscountOpen(false);
        }}
        onOpenChange={setDiscountOpen}
        open={discountOpen}
      />
      <UnderCostDialog
        lines={underCostLines}
        onContinue={(reason) => {
          setUnderCostReason(reason);
          setUnderCostOpen(false);
          setFinalizeOpen(true);
        }}
        onOpenChange={setUnderCostOpen}
        open={underCostOpen}
      />
      <FinalizeDialog
        busy={checkoutBusy}
        cart={cart}
        onConfirm={() => void confirmFinalization()}
        onOpenChange={setFinalizeOpen}
        open={finalizeOpen}
      />
    </PageContainer>
  );
}
