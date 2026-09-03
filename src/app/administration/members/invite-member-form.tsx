"use client";

import { useState, type FormEvent } from "react";
import { useWorkspace } from "@/components/layout";
import { Button, Card, CardContent, CardHeader, CardTitle, Field, Input, useToast } from "@/components/ui";

export function InviteMemberForm() {
  const { organizationId } = useWorkspace(); const { toast } = useToast(); const [busy, setBusy] = useState(false); const [acceptanceUrl, setAcceptanceUrl] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setAcceptanceUrl(null); const form = event.currentTarget; const data = new FormData(form);
    try {
      const response = await fetch("/api/administration/members/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizationId, email: data.get("email"), displayName: data.get("displayName") }) });
      const body = await response.json() as { code?: string; acceptanceUrl?: string }; if (!response.ok) throw new Error(body.code);
      form.reset(); setAcceptanceUrl(body.acceptanceUrl ?? null); window.dispatchEvent(new Event("astu:members-changed")); toast({ title: "Invitation créée", description: "Le lien est valable pendant 48 heures.", variant: "success" });
    } catch (failure) { toast({ title: "Invitation impossible", description: failure instanceof Error ? failure.message : "Erreur inattendue", variant: "error" }); }
    finally { setBusy(false); }
  }
  return <Card><CardHeader><CardTitle>Inviter un membre</CardTitle><p className="text-sm text-text-secondary">Le membre recevra un accès Caissier après acceptation. Le rôle pourra être géré séparément par les accès.</p></CardHeader><CardContent><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void submit(event)}><Field label="Nom affiché" name="invite-display-name" required>{({ controlId }) => <Input id={controlId} name="displayName" required />}</Field><Field label="Adresse email" name="invite-email" required>{({ controlId }) => <Input autoComplete="email" id={controlId} name="email" required type="email" />}</Field><div className="sm:col-span-2 sm:flex sm:justify-end"><Button disabled={!organizationId} isLoading={busy} type="submit">Créer l’invitation</Button></div></form>{acceptanceUrl ? <div className="mt-5 rounded-md border border-info/25 bg-info/5 p-4"><p className="text-sm font-semibold">Lien temporaire créé</p><p className="mt-1 text-xs text-text-secondary">Copiez et transmettez ce lien par un canal sûr. Il ne sera plus affiché après avoir quitté cette page.</p><div className="mt-3 flex gap-2"><Input aria-label="Lien d’invitation" readOnly value={acceptanceUrl} /><Button onClick={() => void navigator.clipboard.writeText(acceptanceUrl)} variant="secondary">Copier</Button></div></div> : null}</CardContent></Card>;
}
