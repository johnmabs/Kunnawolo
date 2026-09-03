"use client";
import { useMemo, useState, type FormEvent } from "react";
import { useWorkspace } from "@/components/layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  Input,
  useToast,
} from "@/components/ui";
import { issueApiKey, type IssuedKey } from "../_components/administration-api";
export function ApiKeysView() {
  const workspace = useWorkspace();
  const { toast } = useToast();
  const access = useMemo(
    () => ({ organizationId: workspace.organizationId.trim() }),
    [workspace.organizationId],
  );
  const ready = Boolean(access.organizationId);
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<IssuedKey | null>(null);
  const [saved, setSaved] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault();
    if (!label.trim()) return;
    setBusy(true);
    try {
      setIssued(await issueApiKey(access, label, expiresAt));
      setSaved(false);
      setLabel("");
      setExpiresAt("");
    } catch (failure) {
      toast({
        title: "Création impossible",
        description:
          failure instanceof Error ? failure.message : "Erreur inattendue",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      toast({ title: "Clé copiée", variant: "success" });
    } catch {
      toast({
        title: "Copie impossible",
        description: "Sélectionnez et copiez manuellement la clé.",
        variant: "error",
      });
    }
  }
  if (!ready)
    return (
      <EmptyState
        description="Votre organisation est en cours de chargement."
        title="Contexte administratif indisponible"
      />
    );
  if (issued)
    return (
      <Card className="border-success/30">
        <CardHeader>
          <CardTitle>Clé API créée</CardTitle>
          <p className="text-sm text-text-secondary">
            Copiez cette clé maintenant. Elle ne pourra plus être récupérée
            ensuite.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <pre className="overflow-x-auto rounded-md bg-sidebar p-4 text-sm text-white">
            <code>{issued.token}</code>
          </pre>
          <Button onClick={() => void copy()} variant="secondary">
            Copier
          </Button>
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <Checkbox
              checked={saved}
              onCheckedChange={(checked) => setSaved(checked === true)}
            />
            J’ai sauvegardé cette clé
          </label>
          <Button disabled={!saved} onClick={() => setIssued(null)}>
            Terminer
          </Button>
        </CardContent>
      </Card>
    );
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Créer une clé API</CardTitle>
          <p className="text-sm text-text-secondary">
            Seul un propriétaire actif peut générer une nouvelle clé.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(event) => void create(event)}>
            <Field label="Libellé" name="api-key-label" required>
              {({ controlId }) => (
                <Input
                  id={controlId}
                  onChange={(event) => setLabel(event.target.value)}
                  value={label}
                />
              )}
            </Field>
            <Field
              description="Facultative."
              label="Expiration"
              name="api-key-expiry"
            >
              {({ controlId, descriptionId }) => (
                <Input
                  aria-describedby={descriptionId}
                  id={controlId}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  type="date"
                  value={expiresAt}
                />
              )}
            </Field>
            <Button disabled={!label.trim()} isLoading={busy} type="submit">
              Créer la clé
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="rounded-md border border-border bg-surface-subtle p-4 text-sm text-text-secondary">
        <strong>BACKEND GAP: ApiAccessKeyListProjection</strong> — la liste et
        la révocation guidée restent indisponibles sans projection des clés
        existantes.
      </p>
    </div>
  );
}
