"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthError } from "@/components/auth";
import { Button, Field, Input } from "@/components/ui";

function messageFor(code?: string) {
  return code === "auth.invalid_credentials" ? "L’adresse email ou le mot de passe est incorrect." : "La connexion est momentanément impossible. Réessayez.";
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
      const body = await response.json() as { code?: string };
      if (!response.ok) throw new Error(body.code);
      const next = search.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
      router.refresh();
    } catch (failure) { setError(messageFor(failure instanceof Error ? failure.message : undefined)); }
    finally { setBusy(false); }
  }
  return (
    <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
      <AuthError message={error} />
      <Field label="Adresse email" name="email" required>{({ controlId }) => <Input autoComplete="email" id={controlId} name="email" required type="email" />}</Field>
      <Field label="Mot de passe" name="password" required>{({ controlId }) => <Input autoComplete="current-password" id={controlId} name="password" required type="password" />}</Field>
      <Button className="w-full" isLoading={busy} size="lg" type="submit">Se connecter</Button>
      <p className="text-center text-sm text-text-secondary">Vous démarrez avec Astu Sales ? <Link className="font-semibold text-primary hover:underline" href="/signup">Créer un compte</Link></p>
    </form>
  );
}
