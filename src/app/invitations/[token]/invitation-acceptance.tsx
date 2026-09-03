"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthError } from "@/components/auth";
import { Button, Card, CardContent, Field, Input } from "@/components/ui";
import {
  acceptInvitationAction,
  type InvitationAcceptanceState,
} from "./actions";

type Details = Readonly<{
  email: string;
  displayName: string;
  organizationName: string;
  expiresAt: string;
  requiresPassword: boolean;
}>;

export function InvitationAcceptance({
  token,
  details,
}: Readonly<{ token: string; details: Details | null }>) {
  const actionWithToken = acceptInvitationAction.bind(null, token);
  const [state, action, pending] = useActionState(actionWithToken, {
    error: null,
  } satisfies InvitationAcceptanceState);
  if (details === null)
    return (
      <div className="grid gap-4">
        <AuthError message="Ce lien d’invitation est invalide, expiré ou déjà utilisé." />
        <Button asChild variant="secondary">
          <Link href="/login">Retour à la connexion</Link>
        </Button>
      </div>
    );
  return (
    <form action={action} className="grid gap-5">
      <Card>
        <CardContent className="grid gap-3 pt-5 sm:pt-6">
          <div>
            <p className="text-xs text-text-secondary">Organisation</p>
            <p className="font-semibold">{details.organizationName}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Compte invité</p>
            <p className="text-sm">
              {details.displayName} · {details.email}
            </p>
          </div>
        </CardContent>
      </Card>
      <AuthError message={state.error} />
      {details.requiresPassword ? (
        <Field
          description="Au moins 15 caractères. Ce mot de passe sécurisera votre nouveau compte."
          label="Créer un mot de passe"
          name="password"
          required
        >
          {({ controlId, descriptionId }) => (
            <Input
              aria-describedby={descriptionId}
              autoComplete="new-password"
              id={controlId}
              minLength={15}
              name="password"
              required
              type="password"
            />
          )}
        </Field>
      ) : (
        <p className="rounded-md bg-surface-subtle px-4 py-3 text-sm text-text-secondary">
          Connectez-vous avec <strong>{details.email}</strong> si nécessaire,
          puis revenez accepter l’invitation.
        </p>
      )}
      <Button className="w-full" isLoading={pending} size="lg" type="submit">
        Rejoindre {details.organizationName}
      </Button>
    </form>
  );
}
