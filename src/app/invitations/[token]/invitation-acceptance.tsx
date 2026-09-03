"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthError } from "@/components/auth";
import { Button, Card, CardContent, Field, Input, Skeleton } from "@/components/ui";

type Details = Readonly<{ email: string; displayName: string; organizationName: string; expiresAt: string; requiresPassword: boolean }>;

export function InvitationAcceptance({ token }: Readonly<{ token: string }>) {
  const router = useRouter(); const [details, setDetails] = useState<Details | null>(null); const [loadError, setLoadError] = useState(false); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; void fetch(`/api/invitations/${encodeURIComponent(token)}`, { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<Details>; }).then((value) => { if (active) setDetails(value); }).catch(() => { if (active) setLoadError(true); }); return () => { active = false; }; }, [token]);
  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: data.get("password") }) });
      const body = await response.json() as { code?: string };
      if (!response.ok) {
        if (body.code === "auth.invitation_login_required") { router.push(`/login?next=${encodeURIComponent(`/invitations/${token}`)}`); return; }
        throw new Error(body.code);
      }
      router.replace("/"); router.refresh();
    } catch (failure) { const code = failure instanceof Error ? failure.message : ""; setError(code === "auth.password_too_short" ? "Choisissez une phrase de passe d’au moins 15 caractères." : "L’invitation n’a pas pu être acceptée. Le lien est peut-être expiré."); }
    finally { setBusy(false); }
  }
  if (loadError) return <div className="grid gap-4"><AuthError message="Ce lien d’invitation est invalide, expiré ou déjà utilisé." /><Button asChild variant="secondary"><Link href="/login">Retour à la connexion</Link></Button></div>;
  if (details === null) return <Skeleton className="h-56" />;
  return (
    <form className="grid gap-5" onSubmit={(event) => void accept(event)}>
      <Card><CardContent className="grid gap-3 pt-5 sm:pt-6"><div><p className="text-xs text-text-secondary">Organisation</p><p className="font-semibold">{details.organizationName}</p></div><div><p className="text-xs text-text-secondary">Compte invité</p><p className="text-sm">{details.displayName} · {details.email}</p></div></CardContent></Card>
      <AuthError message={error} />
      {details.requiresPassword ? <Field description="Au moins 15 caractères. Ce mot de passe sécurisera votre nouveau compte." label="Créer un mot de passe" name="password" required>{({ controlId, descriptionId }) => <Input aria-describedby={descriptionId} autoComplete="new-password" id={controlId} minLength={15} name="password" required type="password" />}</Field> : <p className="rounded-md bg-surface-subtle px-4 py-3 text-sm text-text-secondary">Connectez-vous avec <strong>{details.email}</strong> si nécessaire, puis revenez accepter l’invitation.</p>}
      <Button className="w-full" isLoading={busy} size="lg" type="submit">Rejoindre {details.organizationName}</Button>
    </form>
  );
}
