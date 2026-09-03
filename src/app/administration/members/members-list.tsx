"use client";

import { useWorkspace } from "@/components/layout";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { ResendInvitationForm } from "./resend-invitation-form";

type DeliveryStatus = "PENDING" | "PROCESSING" | "FAILED" | "SENT" | "CANCELLED";
export type Member = Readonly<{ id: string; displayName: string; email: string; status: "INVITED" | "ACTIVE" | "INACTIVE"; role: string; invitedAt: string; invitationExpiresAt: string | null; invitationId: string | null; invitationDeliveryStatus: DeliveryStatus | null; invitationDeliveryAttempts: number }>;
const status = { ACTIVE: { label: "Actif", variant: "success" }, INVITED: { label: "Invité", variant: "warning" }, INACTIVE: { label: "Inactif", variant: "neutral" } } as const;
const roles: Readonly<Record<string, string>> = { OWNER: "Propriétaire", MANAGER: "Responsable", CASHIER: "Caissier" };
const deliveries: Readonly<Record<DeliveryStatus, string>> = { PENDING: "Envoi en attente", PROCESSING: "Envoi en cours", FAILED: "Échec de l’envoi", SENT: "Email envoyé", CANCELLED: "Envoi annulé" };

function DeliveryDetails({ member }: Readonly<{ member: Member }>) {
  if (member.status !== "INVITED" || member.invitationDeliveryStatus === null) return null;
  return <p className={member.invitationDeliveryStatus === "FAILED" ? "mt-1 text-xs font-medium text-danger" : "mt-1 text-xs text-text-secondary"}>{deliveries[member.invitationDeliveryStatus]}{member.invitationDeliveryStatus === "FAILED" ? ` · ${member.invitationDeliveryAttempts} tentative${member.invitationDeliveryAttempts > 1 ? "s" : ""}` : ""}</p>;
}

export function MembersList({ items = [] }: Readonly<{ items?: readonly Member[] }>) {
  const { organizationId } = useWorkspace();
  if (items.length === 0) return <EmptyState description="Aucun membre n’existe encore dans cette organisation." title="Aucun membre" />;
  return <Card><CardHeader><CardTitle>Membres de l’organisation</CardTitle></CardHeader><CardContent><div className="hidden overflow-hidden rounded-md border border-border md:block"><table className="w-full text-left text-sm"><thead className="bg-surface-subtle text-xs uppercase text-text-secondary"><tr><th className="px-4 py-3">Membre</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody>{items.map((member) => <tr className="border-t border-border" key={member.id}><td className="px-4 py-4"><p className="font-medium">{member.displayName}</p><p className="text-text-secondary">{member.email}</p></td><td className="px-4 py-4"><Badge variant={status[member.status].variant}>{status[member.status].label}</Badge>{member.status === "INVITED" && member.invitationExpiresAt ? <p className="mt-1 text-xs text-text-secondary">Expire le {new Date(member.invitationExpiresAt).toLocaleDateString("fr-FR")}</p> : null}<DeliveryDetails member={member} /></td><td className="px-4 py-4">{roles[member.role] ?? member.role}</td><td className="px-4 py-4 text-right">{member.status === "INVITED" && member.invitationId ? <ResendInvitationForm failed={member.invitationDeliveryStatus === "FAILED"} invitationId={member.invitationId} organizationId={organizationId} /> : null}</td></tr>)}</tbody></table></div><div className="grid gap-3 md:hidden">{items.map((member) => <div className="rounded-md border border-border p-4" key={member.id}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{member.displayName}</p><p className="mt-1 break-all text-sm text-text-secondary">{member.email}</p></div><Badge variant={status[member.status].variant}>{status[member.status].label}</Badge></div><p className="mt-3 text-sm">{roles[member.role] ?? member.role}</p><DeliveryDetails member={member} />{member.status === "INVITED" && member.invitationId ? <div className="mt-3"><ResendInvitationForm compact failed={member.invitationDeliveryStatus === "FAILED"} invitationId={member.invitationId} organizationId={organizationId} /></div> : null}</div>)}</div></CardContent></Card>;
}
