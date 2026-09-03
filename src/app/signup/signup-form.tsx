"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthError } from "@/components/auth";
import { Button, Field, Input } from "@/components/ui";

function messageFor(code?: string) {
  if (code === "auth.email_taken") return "Un compte existe déjà avec cette adresse email. Connectez-vous pour continuer.";
  if (code === "auth.password_too_short") return "Choisissez une phrase de passe d’au moins 15 caractères.";
  if (code === "auth.password_too_long") return "Le mot de passe ne peut pas dépasser 128 caractères.";
  return "La création du compte est momentanément impossible. Réessayez.";
}

export function SignupForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName: data.get("displayName"), email: data.get("email"), password: data.get("password") }) });
      const body = await response.json() as { code?: string }; if (!response.ok) throw new Error(body.code);
      router.replace("/onboarding"); router.refresh();
    } catch (failure) { setError(messageFor(failure instanceof Error ? failure.message : undefined)); }
    finally { setBusy(false); }
  }
  return (
    <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
      <AuthError message={error} />
      <Field label="Nom affiché" name="displayName" required>{({ controlId }) => <Input autoComplete="name" id={controlId} name="displayName" required />}</Field>
      <Field label="Adresse email" name="email" required>{({ controlId }) => <Input autoComplete="email" id={controlId} name="email" required type="email" />}</Field>
      <Field description="Utilisez une phrase facile à retenir d’au moins 15 caractères." label="Mot de passe" name="password" required>{({ controlId, descriptionId }) => <Input aria-describedby={descriptionId} autoComplete="new-password" id={controlId} maxLength={128} minLength={15} name="password" required type="password" />}</Field>
      <Button className="w-full" isLoading={busy} size="lg" type="submit">Créer mon compte</Button>
      <p className="text-center text-sm text-text-secondary">Vous avez déjà un compte ? <Link className="font-semibold text-primary hover:underline" href="/login">Se connecter</Link></p>
    </form>
  );
}
