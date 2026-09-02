"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageContainer, useWorkspace } from "@/components/layout";
import { Button, EmptyState, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { InventorySessions } from "./inventory-sessions";
import { StockView } from "./stock-view";

export function InventoryWorkspace() {
  const { apiKey, organizationId, workspaceShopId } = useWorkspace();
  const [tab, setTab] = useState("stock");
  const access = useMemo(() => ({ apiKey, organizationId: organizationId.trim(), shopId: workspaceShopId.trim() }), [apiKey, organizationId, workspaceShopId]);
  const ready = access.apiKey.trim().length > 0 && access.organizationId.length > 0 && access.shopId.length > 0;
  if (!ready) return <PageContainer><EmptyState action={<Button asChild><Link href="/">Configurer le poste</Link></Button>} description="Renseignez l’organisation, la clé d’accès et la boutique de travail depuis le tableau de bord." title="Contexte de stock incomplet" /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader description="Consultez les niveaux disponibles et réalisez les opérations de stock dans la boutique de travail." eyebrow={`Boutique ID : ${access.shopId}`} title="Stock" />
      <Tabs className="mt-6" onValueChange={setTab} value={tab}>
        <TabsList aria-label="Sections du stock"><TabsTrigger value="stock">Vue stock</TabsTrigger><TabsTrigger value="inventories">Inventaires</TabsTrigger></TabsList>
        <TabsContent value="stock"><StockView access={access} /></TabsContent>
        <TabsContent value="inventories"><InventorySessions access={access} /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
