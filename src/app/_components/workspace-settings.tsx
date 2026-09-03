"use client";

import { useRef, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Switch,
  useToast,
} from "@/components/ui";
import { useWorkspace } from "@/components/layout";

export function WorkspaceSettings() {
  const {
    compact,
    organizationId,
    organizations,
    setCompact,
    setOrganizationId,
    setWorkspaceShopId,
    workspaceShopId,
  } = useWorkspace();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const requestKey = useRef(crypto.randomUUID());
  const organization = organizations.find(({ id }) => id === organizationId);
  async function save() {
    setBusy(true);
    try {
      const response = await fetch("/api/workspace-preference", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestKey.current,
        },
        body: JSON.stringify({
          organizationId,
          shopId: workspaceShopId || null,
          isCompact: compact,
        }),
      });
      const body = (await response.json()) as Readonly<{ code?: string }>;
      if (!response.ok)
        throw new Error(body.code ?? "workspace.preference_failed");
      requestKey.current = crypto.randomUUID();
      toast({ title: "Préférence de poste enregistrée", variant: "success" });
    } catch (failure) {
      toast({
        title: "Enregistrement impossible",
        description:
          failure instanceof Error ? failure.message : "Erreur inattendue",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  const selectClass =
    "min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-3 focus:ring-primary/15";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration du poste</CardTitle>
        <p className="text-sm text-text-secondary">
          Choisissez le contexte opérationnel associé à votre session. Les clés
          API restent réservées aux intégrations techniques.
        </p>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Organisation" name="organization-id" required>
            {({ controlId }) => (
              <select
                className={selectClass}
                id={controlId}
                onChange={(event) => setOrganizationId(event.target.value)}
                value={organizationId}
              >
                {organizations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            description="Contexte opérationnel des ventes et opérations de stock."
            label="Boutique de travail"
            name="workspace-shop-id"
          >
            {({ controlId, descriptionId }) => (
              <select
                aria-describedby={descriptionId}
                className={selectClass}
                disabled={!organization?.shops.length}
                id={controlId}
                onChange={(event) => setWorkspaceShopId(event.target.value)}
                value={workspaceShopId}
              >
                {organization?.shops.length ? (
                  organization.shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))
                ) : (
                  <option value="">Aucune boutique disponible</option>
                )}
              </select>
            )}
          </Field>
          <label
            className="flex min-h-11 items-center gap-3 self-end text-sm font-medium"
            htmlFor="compact-mode"
          >
            <Switch
              checked={compact}
              id="compact-mode"
              onCheckedChange={setCompact}
            />
            Affichage compact
          </label>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={!organizationId}
            isLoading={busy}
            onClick={() => void save()}
            variant="secondary"
          >
            Enregistrer ce poste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
