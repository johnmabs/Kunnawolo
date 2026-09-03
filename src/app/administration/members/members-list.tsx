"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "@/components/layout";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, ErrorState, Input, Skeleton, useToast } from "@/components/ui";

type DeliveryStatus = "PENDING" | "PROCESSING" | "FAILED" | "SENT" | "CANCELLED";
type Member = Readonly<{ id: string; displayName: string; email: string; status: "INVITED" | "ACTIVE" | "INACTIVE"; role: string; invitedAt: string; invitationExpiresAt: string | null; invitationId: string | null; invitationDeliveryStatus: DeliveryStatus | null; invitationDeliveryAttempts: number }>;
const status = { ACTIVE: { label: "Actif", variant: "success" }, INVITED: { label: "Invité", variant: "warning" }, INACTIVE: { label: "Inactif", variant: "neutral" } } as const;
const roles: Readonly<Record<string, string>> = { OWNER: "Propriétaire", MANAGER: "Responsable", CASHIER: "Caissier" };
const deliveries: Readonly<Record<DeliveryStatus, string>> = { PENDING: "Envoi en attente", PROCESSING: "Envoi en cours", FAILED: "Échec de l’envoi", SENT: "Email envoyé", CANCELLED: "Envoi annulé" };

function DeliveryDetails({ member }: Readonly<{ member: Member }>) {
  if (member.status !== "INVITED" || member.invitationDeliveryStatus === null) return null;
  return <p className={member.invitationDeliveryStatus === "FAILED" ? "mt-1 text-xs font-medium text-danger" : "mt-1 text-xs text-text-secondary"}>{deliveries[member.invitationDeliveryStatus]}{member.invitationDeliveryStatus === "FAILED" ? ` · ${member.invitationDeliveryAttempts} tentative${member.invitationDeliveryAttempts > 1 ? "s" : ""}` : ""}</p>;
}

export function MembersList() {
  const { organizationId } = useWorkspace();
  const { toast } = useToast();
  const [items, setItems] = useState<readonly Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/administration/members?organizationId=${encodeURIComponent(organizationId)}`, { cache: "no-store" });
      const body = await response.json() as { code?: string; items?: readonly Member[] };
      if (!response.ok) throw new Error(body.code);
      setItems(body.items ?? []);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Erreur inattendue"); }
    finally { setLoading(false); }
  }, [organizationId]);
  useEffect(() => { const reload = () => void load(); reload(); window.addEventListener("astu:members-changed", reload); return () => window.removeEventListener("astu:members-changed", reload); }, [load]);

  async function resend(member: Member) {
    if (!organizationId || !member.invitationId) return;
    setResendingId(member.invitationId); setManualUrl(null);
    try {
      const response = await fetch(`/api/administration/members/invitations/${encodeURIComponent(member.invitationId)}/resend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId }) });
      const body = await response.json() as { code?: string; delivery?: "email" | "manual" | "queued" | "failed"; acceptanceUrl?: string };
      if (!response.ok) throw new Error(body.code);
      setManualUrl(body.acceptanceUrl ?? null);
      toast(body.delivery === "email" ? { title: "Invitation renvoyée", description: `Un nouvel email a été envoyé à ${member.email}.`, variant: "success" } : body.delivery === "manual" ? { title: "Nouveau lien créé", description: "Copiez le lien temporaire affiché dans la liste.", variant: "success" } : { title: "Renvoi mis en attente", description: body.delivery === "failed" ? "L’envoi sera retenté automatiquement." : "Il sera traité dès que le service email sera disponible.", variant: "info" });
      await load();
    } catch (failure) { toast({ title: "Renvoi impossible", description: failure instanceof Error ? failure.message : "Erreur inattendue", variant: "error" }); }
    finally { setResendingId(null); }
  }

  if (loading) return <div className="grid gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>;
  if (error) return <ErrorState description={error} onRetry={() => void load()} />;
  if (items.length === 0) return <EmptyState description="Aucun membre n’existe encore dans cette organisation." title="Aucun membre" />;
  return <Card><CardHeader><CardTitle>Membres de l’organisation</CardTitle></CardHeader><CardContent>{manualUrl ? <div className="mb-5 rounded-md border border-info/25 bg-info/5 p-4"><p className="text-sm font-semibold">Nouveau lien temporaire</p><p className="mt-1 text-xs text-text-secondary">L’ancien lien n’est plus valable. Transmettez celui-ci par un canal sûr.</p><div className="mt-3 flex gap-2"><Input aria-label="Nouveau lien d’invitation" readOnly value={manualUrl} /><Button onClick={() => void navigator.clipboard.writeText(manualUrl)} variant="secondary">Copier</Button></div></div> : null}<div className="hidden overflow-hidden rounded-md border border-border md:block"><table className="w-full text-left text-sm"><thead className="bg-surface-subtle text-xs uppercase text-text-secondary"><tr><th className="px-4 py-3">Membre</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{items.map((member) => <tr className="border-t border-border" key={member.id}><td className="px-4 py-4"><p className="font-medium">{member.displayName}</p><p className="text-text-secondary">{member.email}</p></td><td className="px-4 py-4"><Badge variant={status[member.status].variant}>{status[member.status].label}</Badge>{member.status === "INVITED" && member.invitationExpiresAt ? <p className="mt-1 text-xs text-text-secondary">Expire le {new Date(member.invitationExpiresAt).toLocaleDateString("fr-FR")}</p> : null}<DeliveryDetails member={member} /></td><td className="px-4 py-4">{roles[member.role] ?? member.role}</td><td className="px-4 py-4 text-right">{member.status === "INVITED" && member.invitationId ? <Button isLoading={resendingId === member.invitationId} onClick={() => void resend(member)} size="sm" variant="secondary">{member.invitationDeliveryStatus === "FAILED" ? "Réessayer l’envoi" : "Renvoyer"}</Button> : null}</td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{items.map((member) => <div className="rounded-md border border-border p-4" key={member.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{member.displayName}</p><p className="mt-1 break-all text-sm text-text-secondary">{member.email}</p></div><Badge variant={status[member.status].variant}>{status[member.status].label}</Badge></div><p className="mt-3 text-sm">{roles[member.role] ?? member.role}</p><DeliveryDetails member={member} />{member.status === "INVITED" && member.invitationId ? <Button className="mt-3 w-full" isLoading={resendingId === member.invitationId} onClick={() => void resend(member)} variant="secondary">{member.invitationDeliveryStatus === "FAILED" ? "Réessayer l’envoi" : "Renvoyer l’invitation"}</Button> : null}</div>)}</div></CardContent></Card>;
}
