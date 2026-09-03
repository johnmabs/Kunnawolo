"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "@/components/layout";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, ErrorState, Skeleton } from "@/components/ui";

type Member = Readonly<{ id: string; displayName: string; email: string; status: "INVITED" | "ACTIVE" | "INACTIVE"; role: string; invitedAt: string; invitationExpiresAt: string | null }>;
const status = { ACTIVE: { label: "Actif", variant: "success" }, INVITED: { label: "Invité", variant: "warning" }, INACTIVE: { label: "Inactif", variant: "neutral" } } as const;
const roles: Readonly<Record<string, string>> = { OWNER: "Propriétaire", MANAGER: "Responsable", CASHIER: "Caissier" };

export function MembersList() {
  const { organizationId } = useWorkspace(); const [items, setItems] = useState<readonly Member[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { if (!organizationId) return; setLoading(true); setError(null); try { const response = await fetch(`/api/administration/members?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" }); const body = await response.json() as { code?: string; items?: readonly Member[] }; if (!response.ok) throw new Error(body.code); setItems(body.items ?? []); } catch (failure) { setError(failure instanceof Error ? failure.message : "Erreur inattendue"); } finally { setLoading(false); } }, [organizationId]);
  useEffect(() => { const reload = () => void load(); reload(); window.addEventListener("astu:members-changed", reload); return () => window.removeEventListener("astu:members-changed", reload); }, [load]);
  if (loading) return <div className="grid gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (items.length === 0) return <EmptyState description="Aucun membre n’existe encore dans cette organisation." title="Aucun membre" />;
  return <Card><CardHeader><CardTitle>Membres de l’organisation</CardTitle></CardHeader><CardContent><div className="hidden overflow-hidden rounded-md border border-border md:block"><table className="w-full text-left text-sm"><thead className="bg-surface-subtle text-xs uppercase text-text-secondary"><tr><th className="px-4 py-3">Membre</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Rôle</th></tr></thead><tbody>{items.map((member) => <tr className="border-t border-border" key={member.id}><td className="px-4 py-4"><p className="font-medium">{member.displayName}</p><p className="text-text-secondary">{member.email}</p></td><td className="px-4 py-4"><Badge variant={status[member.status].variant}>{status[member.status].label}</Badge>{member.status === "INVITED" && member.invitationExpiresAt ? <p className="mt-1 text-xs text-text-secondary">Expire le {new Date(member.invitationExpiresAt).toLocaleDateString("fr-FR")}</p> : null}</td><td className="px-4 py-4">{roles[member.role] ?? member.role}</td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{items.map((member) => <div className="rounded-md border border-border p-4" key={member.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{member.displayName}</p><p className="mt-1 break-all text-sm text-text-secondary">{member.email}</p></div><Badge variant={status[member.status].variant}>{status[member.status].label}</Badge></div><p className="mt-3 text-sm">{roles[member.role] ?? member.role}</p></div>)}</div></CardContent></Card>;
}
