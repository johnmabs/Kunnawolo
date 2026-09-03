"use client";

import { useActionState, useEffect } from "react";
import { Button, Input, useToast } from "@/components/ui";
import { resendInvitationAction, type InvitationActionState } from "./actions";

export function ResendInvitationForm({
  invitationId,
  organizationId,
  failed,
  compact = false,
}: Readonly<{
  invitationId: string;
  organizationId: string;
  failed: boolean;
  compact?: boolean;
}>) {
  const { toast } = useToast();
  const boundAction = resendInvitationAction.bind(null, invitationId);
  const [state, action, pending] = useActionState(boundAction, {
    acceptanceUrl: null,
    error: null,
    outcome: null,
    revision: 0,
  } satisfies InvitationActionState);
  useEffect(() => {
    if (state.revision === 0) return;
    if (state.error)
      toast({
        title: "Renvoi impossible",
        description: state.error,
        variant: "error",
      });
    else
      toast(
        state.outcome === "email"
          ? { title: "Invitation renvoyée", variant: "success" }
          : {
              title:
                state.outcome === "manual"
                  ? "Nouveau lien créé"
                  : "Renvoi mis en attente",
              variant: state.outcome === "manual" ? "success" : "info",
            },
      );
  }, [state, toast]);
  return (
    <div>
      <form action={action}>
        <input name="organizationId" type="hidden" value={organizationId} />
        <Button
          className={compact ? "w-full" : undefined}
          isLoading={pending}
          size={compact ? "md" : "sm"}
          type="submit"
          variant="secondary"
        >
          {failed
            ? "Réessayer l’envoi"
            : compact
              ? "Renvoyer l’invitation"
              : "Renvoyer"}
        </Button>
      </form>
      {state.acceptanceUrl ? (
        <div className="mt-2 flex gap-2">
          <Input
            aria-label="Nouveau lien d’invitation"
            readOnly
            value={state.acceptanceUrl}
          />
          <Button
            onClick={() =>
              void navigator.clipboard.writeText(state.acceptanceUrl!)
            }
            size="sm"
            variant="secondary"
          >
            Copier
          </Button>
        </div>
      ) : null}
    </div>
  );
}
