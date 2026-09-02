"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer, useWorkspace } from "@/components/layout";
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { transferErrorMessage } from "./error-messages";
import { TransferDraftDrawer } from "./transfer-draft-drawer";
import { TransferReceptionDialog } from "./transfer-reception-dialog";
import { listTransfers } from "./transfers-api";
import type { TransferAccess, TransferItem, TransferList } from "./types";

type TransferTab = "dispatch" | "receive" | "all";

const statusPresentation: Readonly<Record<string, Readonly<{ label: string; variant: "neutral" | "info" | "success" | "warning" | "danger" }>>> = {
  CANCELLED: { label: "Annulé", variant: "danger" },
  DRAFT: { label: "Brouillon", variant: "neutral" },
  RECEIVED: { label: "Reçu", variant: "success" },
  RECEIVING: { label: "Réception en cours", variant: "warning" },
  SENDING: { label: "Expédition en cours", variant: "warning" },
  SENT: { label: "En transit", variant: "info" },
};

function TransferCard({ access, onDraft, onReceive, transfer }: Readonly<{ access: TransferAccess; onDraft: (transfer: TransferItem) => void; onReceive: (transfer: TransferItem) => void; transfer: TransferItem }>) {
  const status = statusPresentation[transfer.status] ?? { label: transfer.status, variant: "neutral" as const };
  const canContinue = transfer.status === "DRAFT" && transfer.sourceShopId === access.shopId;
  const canReceive = transfer.status === "SENT" && transfer.destinationShopId === access.shopId;
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{transfer.sourceShopName} → {transfer.destinationShopName}</h2><Badge variant={status.variant}>{status.label}</Badge></div>
          <p className="mt-2 text-sm text-text-secondary">{transfer.productCount} produit{transfer.productCount > 1 ? "s" : ""} · {transfer.totalQuantity} unité{transfer.totalQuantity > 1 ? "s" : ""}</p>
          <p className="mt-1 text-xs text-text-secondary">Créé le {new Date(transfer.createdAt).toLocaleDateString("fr-FR")}</p>
        </div>
        {canContinue ? <Button onClick={() => onDraft(transfer)} variant="secondary">Continuer</Button> : null}
        {canReceive ? <Button onClick={() => onReceive(transfer)}>Recevoir</Button> : null}
      </div>
    </Card>
  );
}

export function TransfersWorkspace() {
  const { apiKey, organizationId, workspaceShopId } = useWorkspace();
  const access = useMemo<TransferAccess>(() => ({ apiKey, organizationId: organizationId.trim(), shopId: workspaceShopId.trim() }), [apiKey, organizationId, workspaceShopId]);
  const [list, setList] = useState<TransferList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TransferTab>("dispatch");
  const [draft, setDraft] = useState<TransferItem | null>(null);
  const [reception, setReception] = useState<TransferItem | null>(null);
  const ready = access.apiKey.trim().length > 0 && access.organizationId.length > 0 && access.shopId.length > 0;

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try { setList(await listTransfers(access)); }
    catch (loadError) { setError(transferErrorMessage(loadError)); }
    finally { setLoading(false); }
  }, [access, ready]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void listTransfers(access)
      .then((result) => { if (active) setList(result); })
      .catch((loadError: unknown) => { if (active) setError(transferErrorMessage(loadError)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [access, ready]);

  const filtered = useMemo(() => {
    const items = list?.items ?? [];
    if (tab === "dispatch") return items.filter((item) => item.status === "DRAFT" && item.sourceShopId === access.shopId);
    if (tab === "receive") return items.filter((item) => item.status === "SENT" && item.destinationShopId === access.shopId);
    return items;
  }, [access.shopId, list, tab]);

  if (!ready) return <PageContainer><EmptyState action={<Button asChild><Link href="/">Configurer le poste</Link></Button>} description="Renseignez l’organisation, la clé d’accès et la boutique de travail depuis le tableau de bord." title="Contexte de transfert incomplet" /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader
        action={<Button disabled title="BACKEND GAP: ShopListProjection">+ Nouveau transfert</Button>}
        description="Préparez les expéditions et réceptionnez les marchandises de la boutique de travail."
        eyebrow={`Boutique ID : ${access.shopId}`}
        title="Transferts"
      />
      <p className="mt-3 text-xs text-text-secondary"><strong>BACKEND GAP: ShopListProjection</strong> — la création reste indisponible tant que les boutiques autorisées ne peuvent pas être proposées sans saisir d’identifiants techniques.</p>

      <Tabs className="mt-6" onValueChange={(value) => setTab(value as TransferTab)} value={tab}>
        <TabsList aria-label="Filtrer les transferts"><TabsTrigger value="dispatch">À expédier</TabsTrigger><TabsTrigger value="receive">À réceptionner</TabsTrigger><TabsTrigger value="all">Tous</TabsTrigger></TabsList>
        {(["dispatch", "receive", "all"] as const).map((value) => (
          <TabsContent key={value} value={value}>
            {loading ? <div className="grid gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div> : null}
            {!loading && error ? <ErrorState description={error} onRetry={() => void load()} /> : null}
            {!loading && !error && list?.items.length === 0 ? <EmptyState description="Aucun transfert n’existe encore pour cette boutique." title="Aucun transfert" /> : null}
            {!loading && !error && list && list.items.length > 0 && filtered.length === 0 ? <EmptyState description="Aucun transfert ne correspond à cet état pour la boutique de travail." title="Aucun résultat" /> : null}
            {!loading && !error && filtered.length > 0 ? <div className="grid gap-3">{filtered.map((transfer) => <TransferCard access={access} key={transfer.transferId} onDraft={setDraft} onReceive={setReception} transfer={transfer} />)}</div> : null}
          </TabsContent>
        ))}
      </Tabs>

      {draft ? <TransferDraftDrawer access={access} key={draft.transferId} onOpenChange={(open) => { if (!open) setDraft(null); }} onUpdated={() => void load()} open transfer={draft} /> : null}
      {reception ? <TransferReceptionDialog access={access} key={reception.transferId} onOpenChange={(open) => { if (!open) setReception(null); }} onReceived={() => void load()} open transfer={reception} /> : null}
    </PageContainer>
  );
}
