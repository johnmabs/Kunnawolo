"use client";

import { useActionState, useEffect, useRef } from "react";
import { useWorkspace } from "@/components/layout";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Field, Input, useToast } from "@/components/ui";
import { createShopAction, type CreateShopState } from "./actions";

type Shop = Readonly<{ id: string; name: string; code: string; isActive: boolean }>;

export function ShopsView({ items = [] }: Readonly<{ items?: readonly Shop[] }>) {
  const { organizationId } = useWorkspace(); const { toast } = useToast(); const formRef = useRef<HTMLFormElement>(null); const [creation, action, pending] = useActionState(createShopAction, { error: null, created: false, revision: 0 } satisfies CreateShopState);
  useEffect(() => { if (creation.revision === 0) return; if (creation.created) { formRef.current?.reset(); toast({ title: "Boutique créée", variant: "success" }); } else toast({ title: "Création impossible", description: creation.error, variant: "error" }); }, [creation, toast]);
  return <div className="grid gap-6"><Card><CardHeader><CardTitle>Nouvelle boutique</CardTitle><p className="text-sm text-text-secondary">Ajoutez un point de vente à l’organisation actuelle.</p></CardHeader><CardContent><form action={action} className="grid gap-4 sm:grid-cols-[1fr_12rem_auto]" ref={formRef}><input name="organizationId" type="hidden" value={organizationId} /><Field label="Nom" name="shop-name" required>{({ controlId }) => <Input id={controlId} name="name" placeholder="Tié-Tié" required />}</Field><Field description="Court et stable." label="Code" name="shop-code" required>{({ controlId, descriptionId }) => <Input aria-describedby={descriptionId} id={controlId} name="code" placeholder="TIE-TIE" required />}</Field><Button className="self-end" disabled={!organizationId} isLoading={pending} type="submit">Créer la boutique</Button></form></CardContent></Card>{items.length === 0 ? <EmptyState description="Aucune boutique n’existe encore dans cette organisation." title="Aucune boutique" /> : <Card><CardHeader><CardTitle>Boutiques</CardTitle></CardHeader><CardContent><div className="grid gap-3">{items.map((shop) => <div className="flex min-h-16 items-center justify-between gap-4 rounded-md border border-border px-4 py-3" key={shop.id}><div><p className="font-medium">{shop.name}</p><p className="text-sm text-text-secondary">{shop.code}</p></div><Badge variant={shop.isActive ? "success" : "neutral"}>{shop.isActive ? "Active" : "Inactive"}</Badge></div>)}</div></CardContent></Card>}</div>;
}
