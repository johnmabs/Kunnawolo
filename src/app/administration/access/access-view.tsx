"use client";

import { useCallback, useEffect, useState } from "react";
import { useWorkspace } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  useToast,
} from "@/components/ui";

type Role = "OWNER" | "MANAGER" | "CASHIER";
type Member = Readonly<{
  id: string;
  userAccountId: string;
  displayName: string;
  email: string;
  status: "INVITED" | "ACTIVE" | "INACTIVE";
  role: Role;
  shopIds: readonly string[];
}>;
type Shop = Readonly<{
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}>;
const roleLabels: Readonly<Record<Role, string>> = {
  OWNER: "Propriétaire",
  MANAGER: "Responsable",
  CASHIER: "Caissier",
};

export function AccessView() {
  const { account, organizationId } = useWorkspace();
  const { toast } = useToast();
  const [members, setMembers] = useState<readonly Member[]>([]);
  const [shops, setShops] = useState<readonly Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const [role, setRole] = useState<Role>("CASHIER");
  const [shopIds, setShopIds] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setError(null);
    try {
      const [membersResponse, shopsResponse] = await Promise.all([
        fetch(
          `/api/administration/members?organizationId=${encodeURIComponent(organizationId)}`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/administration/shops?organizationId=${encodeURIComponent(organizationId)}`,
          { cache: "no-store" },
        ),
      ]);
      const memberBody = (await membersResponse.json()) as {
        code?: string;
        items?: readonly Member[];
      };
      const shopBody = (await shopsResponse.json()) as {
        code?: string;
        items?: readonly Shop[];
      };
      if (!membersResponse.ok) throw new Error(memberBody.code);
      if (!shopsResponse.ok) throw new Error(shopBody.code);
      setMembers(memberBody.items ?? []);
      setShops((shopBody.items ?? []).filter(({ isActive }) => isActive));
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Erreur inattendue",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);
  useEffect(() => {
    const reload = () => void load();
    reload();
  }, [load]);
  function edit(member: Member) {
    setSelected(member);
    setRole(member.role);
    setShopIds(member.shopIds);
  }
  function toggleShop(shopId: string, checked: boolean) {
    setShopIds((current) =>
      checked ? [...current, shopId] : current.filter((id) => id !== shopId),
    );
  }
  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/administration/members/${encodeURIComponent(selected.userAccountId)}/access`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ organizationId, role, shopIds }),
        },
      );
      const body = (await response.json()) as { code?: string };
      if (!response.ok) throw new Error(body.code);
      setSelected(null);
      await load();
      toast({ title: "Accès mis à jour", variant: "success" });
    } catch (failure) {
      const code = failure instanceof Error ? failure.message : "";
      const messages: Readonly<Record<string, string>> = {
        "iam.last_owner_required":
          "Le dernier propriétaire actif ne peut pas être rétrogradé.",
        "iam.shop_assignment_required":
          "Sélectionnez au moins une boutique pour ce membre actif.",
      };
      toast({
        title: "Modification impossible",
        description: (messages[code] ?? code) || "Erreur inattendue",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="grid gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  if (error)
    return <ErrorState description={error} onRetry={() => void load()} />;
  if (members.length === 0)
    return (
      <EmptyState
        description="Aucun membre ne peut être configuré."
        title="Aucun accès"
      />
    );
  return (
    <>
      <Card>
        <CardContent className="grid gap-3 pt-5 sm:pt-6">
          {members.map((member) => (
            <div
              className="flex flex-col gap-4 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              key={member.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{member.displayName}</p>
                  {member.userAccountId === account?.id ? (
                    <Badge variant="info">Vous</Badge>
                  ) : null}
                  <Badge
                    variant={
                      member.status === "ACTIVE"
                        ? "success"
                        : member.status === "INVITED"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {member.status === "ACTIVE"
                      ? "Actif"
                      : member.status === "INVITED"
                        ? "Invité"
                        : "Inactif"}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-text-secondary">
                  {member.email}
                </p>
                <p className="mt-2 text-sm">
                  {roleLabels[member.role]}
                  {member.role !== "OWNER"
                    ? ` · ${member.shopIds.length} boutique${member.shopIds.length > 1 ? "s" : ""}`
                    : " · Toutes les boutiques"}
                </p>
              </div>
              <Button onClick={() => edit(member)} variant="secondary">
                Gérer l’accès
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        open={selected !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer l’accès</DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.displayName} · ${selected.email}`
                : "Modifiez le rôle et les boutiques autorisées."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 grid gap-5">
            <Field label="Rôle" name="member-role" required>
              {({ controlId }) => (
                <Select
                  onValueChange={(value) => {
                    setRole(value as Role);
                    if (value === "OWNER") setShopIds([]);
                  }}
                  value={role}
                >
                  <SelectTrigger id={controlId}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Propriétaire</SelectItem>
                    <SelectItem value="MANAGER">Responsable</SelectItem>
                    <SelectItem value="CASHIER">Caissier</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
            {role === "OWNER" ? (
              <p className="rounded-md bg-info/5 p-4 text-sm text-text-secondary">
                Un propriétaire accède à toutes les boutiques de l’organisation.
              </p>
            ) : (
              <fieldset>
                <legend className="text-sm font-medium">
                  Boutiques autorisées
                </legend>
                <div className="mt-2 grid gap-2">
                  {shops.map((shop) => (
                    <label
                      className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 text-sm"
                      key={shop.id}
                    >
                      <Checkbox
                        checked={shopIds.includes(shop.id)}
                        onCheckedChange={(checked) =>
                          toggleShop(shop.id, checked === true)
                        }
                      />
                      <span>
                        <span className="block font-medium">{shop.name}</span>
                        <span className="text-xs text-text-secondary">
                          {shop.code}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                {selected?.status === "ACTIVE" && shopIds.length === 0 ? (
                  <p className="mt-2 text-sm text-danger">
                    Sélectionnez au moins une boutique.
                  </p>
                ) : null}
              </fieldset>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelected(null)} variant="secondary">
              Annuler
            </Button>
            <Button
              disabled={
                role !== "OWNER" &&
                selected?.status === "ACTIVE" &&
                shopIds.length === 0
              }
              isLoading={busy}
              onClick={() => void save()}
            >
              Enregistrer les accès
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
