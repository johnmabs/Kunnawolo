"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthError } from "@/components/auth";
import { Button, Field, Input } from "@/components/ui";
import { signupAction, type SignupState } from "./actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, {
    error: null,
  } satisfies SignupState);
  return (
    <form action={action} className="grid gap-5">
      <AuthError message={state.error} />
      <Field label="Nom affiché" name="displayName" required>
        {({ controlId }) => (
          <Input
            autoComplete="name"
            id={controlId}
            name="displayName"
            required
          />
        )}
      </Field>
      <Field label="Adresse email" name="email" required>
        {({ controlId }) => (
          <Input
            autoComplete="email"
            id={controlId}
            name="email"
            required
            type="email"
          />
        )}
      </Field>
      <Field
        description="Utilisez une phrase facile à retenir d’au moins 15 caractères."
        label="Mot de passe"
        name="password"
        required
      >
        {({ controlId, descriptionId }) => (
          <Input
            aria-describedby={descriptionId}
            autoComplete="new-password"
            id={controlId}
            maxLength={128}
            minLength={15}
            name="password"
            required
            type="password"
          />
        )}
      </Field>
      <Button className="w-full" isLoading={pending} size="lg" type="submit">
        Créer mon compte
      </Button>
      <p className="text-center text-sm text-text-secondary">
        Vous avez déjà un compte ?{" "}
        <Link
          className="font-semibold text-primary hover:underline"
          href="/login"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
