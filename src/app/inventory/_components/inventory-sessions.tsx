"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { inventoryErrorMessage } from "./error-messages";
import { listInventorySessions } from "./inventory-api";
import type { InventoryAccess, InventorySessionList } from "./types";

export function InventorySessions({ access }: Readonly<{ access: InventoryAccess }>) {
  const [sessions, setSessions] = useState<InventorySessionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setSessions(await listInventorySessions(access)); } catch (loadError) { setError(inventoryErrorMessage(loadError)); } finally { setLoading(false); } }, [access]);
  useEffect(() => {
    let active = true;
    void listInventorySessions(access).then((result) => { if (active) setSessions(result); }).catch((loadError: unknown) => { if (active) setError(inventoryErrorMessage(loadError)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [access]);
  if (loading) return <div className="grid gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (!sessions || sessions.items.length === 0) return <EmptyState description="Aucune session d’inventaire n’a été ouverte dans cette boutique." title="Aucun inventaire" />;
  return <div className="grid gap-3">{sessions.items.map((session) => <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between" key={session.sessionId}><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Inventaire du {new Date(session.openedAt).toLocaleDateString("fr-FR")}</h3><Badge variant={session.status === "OPEN" ? "info" : "neutral"}>{session.status === "OPEN" ? "En cours" : "Clôturé"}</Badge></div><p className="mt-2 text-sm text-text-secondary">{session.countedLineCount}/{session.totalLineCount} produits comptés · {session.progressPercentage}%</p>{session.status !== "OPEN" ? <p className="mt-1 text-sm text-text-secondary">{session.discrepancyLineCount} écarts · {session.discrepancyQuantity} unités</p> : null}</div><Button disabled title="BACKEND GAP: InventorySessionDetailProjection" variant="secondary">{session.status === "OPEN" ? "Continuer" : "Consulter"}</Button></article>)}</div>;
}
