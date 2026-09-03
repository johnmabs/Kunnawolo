"use client";

import { useActionState, useEffect, useRef } from "react";
import { useWorkspace } from "@/components/layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  useToast,
} from "@/components/ui";
import { inviteMemberAction, type InvitationActionState } from "./actions";

export function InviteMemberActionForm() {
  const { organizationId } = useWorkspace();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(inviteMemberAction, {
    acceptanceUrl: null,
    error: null,
    outcome: null,
    revision: 0,
  } satisfies InvitationActionState);
  useEffect(() => {
    if (state.revision === 0) return;
    if (state.error) {
      toast({
        title: "Invitation impossible",
        description: state.error,
        variant: "error",
      });
      return;
    }
    formRef.current?.reset();
    toast(
      state.outcome === "email"
        ? { title: "Invitation envoyée", variant: "success" }
        : state.outcome === "manual"
          ? {
              title: "Invitation créée",
              description: "Le lien est valable pendant 48 heures.",
              variant: "success",
            }
          : {
              title: "Invitation mise en attente",
              description:
                state.outcome === "failed"
                  ? "Le premier envoi sera retenté automatiquement."
                  : "Elle sera envoyée dès que le service email sera disponible.",
              variant: "info",
            },
    );
  }, [state, toast]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inviter un membre</CardTitle>
        <p className="text-sm text-text-secondary">
          Le membre recevra un accès Caissier après acceptation. Le rôle pourra
          être géré séparément par les accès.
        </p>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="grid gap-4 sm:grid-cols-2"
          ref={formRef}
        >
          <input name="organizationId" type="hidden" value={organizationId} />
          <Field label="Nom affiché" name="invite-display-name-action" required>
            {({ controlId }) => (
              <Input id={controlId} name="displayName" required />
            )}
          </Field>
          <Field label="Adresse email" name="invite-email-action" required>
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
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <Button
              disabled={!organizationId}
              isLoading={pending}
              type="submit"
            >
              Créer l’invitation
            </Button>
          </div>
        </form>
        {state.acceptanceUrl ? (
          <div className="mt-5 rounded-md border border-info/25 bg-info/5 p-4">
            <p className="text-sm font-semibold">Lien temporaire créé</p>
            <p className="mt-1 text-xs text-text-secondary">
              Copiez et transmettez ce lien par un canal sûr.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                aria-label="Lien d’invitation"
                readOnly
                value={state.acceptanceUrl}
              />
              <Button
                onClick={() =>
                  void navigator.clipboard.writeText(state.acceptanceUrl!)
                }
                variant="secondary"
              >
                Copier
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
