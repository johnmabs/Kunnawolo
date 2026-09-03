"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthError } from "@/components/auth";
import { Button, Field, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

export function OrganizationForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/onboarding/organization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), currency: data.get("currency") }) });
      const body = await response.json() as { code?: string }; if (!response.ok) throw new Error(body.code);
      router.replace("/"); router.refresh();
    } catch { setError("La création de l’organisation est momentanément impossible. Réessayez."); }
    finally { setBusy(false); }
  }
  return (
    <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
      <AuthError message={error} />
      <Field label="Nom de l’organisation" name="name" required>{({ controlId }) => <Input autoComplete="organization" autoFocus id={controlId} name="name" required />}</Field>
      <Field description="La devise sera utilisée pour les ventes, prix et rapports." label="Devise" name="currency" required>{({ controlId, descriptionId }) => <Select defaultValue="XOF" name="currency"><SelectTrigger aria-describedby={descriptionId} id={controlId}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="XOF">Franc CFA (XOF)</SelectItem><SelectItem value="EUR">Euro (EUR)</SelectItem><SelectItem value="USD">Dollar américain (USD)</SelectItem></SelectContent></Select>}</Field>
      <Button className="w-full" isLoading={busy} size="lg" type="submit">Créer l’organisation</Button>
      <p className="text-center text-xs leading-5 text-text-secondary">Vous deviendrez propriétaire de cette organisation.</p>
    </form>
  );
}
