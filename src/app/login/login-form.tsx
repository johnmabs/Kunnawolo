"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthError } from "@/components/auth";
import { Button, Field, Input } from "@/components/ui";

import { loginAction, type LoginState } from "./actions";

export function LoginForm({ next = "" }: Readonly<{ next?: string }>) {
  const [state, action, pending] = useActionState(loginAction, { error: null } satisfies LoginState);
  return (
    <form action={action} className="grid gap-5">
      <AuthError message={state.error} />
      <input name="next" type="hidden" value={next} />
      <Field label="Adresse email" name="email" required>{({ controlId }) => <Input autoComplete="email" id={controlId} name="email" required type="email" />}</Field>
      <Field label="Mot de passe" name="password" required>{({ controlId }) => <Input autoComplete="current-password" id={controlId} name="password" required type="password" />}</Field>
      <Button className="w-full" isLoading={pending} size="lg" type="submit">Se connecter</Button>
      <p className="text-center text-sm text-text-secondary">Vous démarrez avec Astu Sales ? <Link className="font-semibold text-primary hover:underline" href="/signup">Créer un compte</Link></p>
    </form>
  );
}
