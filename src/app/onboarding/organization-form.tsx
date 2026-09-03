"use client";

import { useActionState } from "react";
import { AuthError } from "@/components/auth";
import { Button, Field, Input } from "@/components/ui";
import {
  createOrganizationAction,
  type OrganizationOnboardingState,
} from "./actions";

export function OrganizationForm() {
  const [state, action, pending] = useActionState(createOrganizationAction, {
    error: null,
  } satisfies OrganizationOnboardingState);
  return (
    <form action={action} className="grid gap-5">
      <AuthError message={state.error} />
      <Field label="Nom de l’organisation" name="name" required>
        {({ controlId }) => (
          <Input
            autoComplete="organization"
            autoFocus
            id={controlId}
            name="name"
            required
          />
        )}
      </Field>
      <Field
        description="La devise sera utilisée pour les ventes, prix et rapports."
        label="Devise"
        name="currency"
        required
      >
        {({ controlId, descriptionId }) => (
          <select
            aria-describedby={descriptionId}
            className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
            defaultValue="XOF"
            id={controlId}
            name="currency"
            required
          >
            <option value="XOF">Franc CFA (XOF)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="USD">Dollar américain (USD)</option>
          </select>
        )}
      </Field>
      <div className="mt-2 border-t border-border pt-5">
        <p className="font-semibold text-text-primary">Première boutique</p>
        <p className="mt-1 text-sm text-text-secondary">
          Vous pourrez ajouter d’autres boutiques depuis l’administration.
        </p>
      </div>
      <Field label="Nom de la boutique" name="shopName" required>
        {({ controlId }) => (
          <Input
            id={controlId}
            name="shopName"
            placeholder="Centre-ville"
            required
          />
        )}
      </Field>
      <Field
        description="Un code court et stable, par exemple CENTRE."
        label="Code de la boutique"
        name="shopCode"
        required
      >
        {({ controlId, descriptionId }) => (
          <Input
            aria-describedby={descriptionId}
            id={controlId}
            name="shopCode"
            placeholder="CENTRE"
            required
          />
        )}
      </Field>
      <Button className="w-full" isLoading={pending} size="lg" type="submit">
        Créer l’organisation
      </Button>
      <p className="text-center text-xs leading-5 text-text-secondary">
        Vous deviendrez propriétaire de cette organisation.
      </p>
    </form>
  );
}
