"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { selectOrganizationAction } from "./actions";

export type WorkspaceOrganization = Readonly<{ id: string; name: string; currency: string; role: string; preference: Readonly<{ shopId: string | null; isCompact: boolean }> | null; shops: readonly Readonly<{ id: string; name: string; code: string }>[] }>;
export type WorkspaceAccount = Readonly<{ id: string; email: string; displayName: string }>;
export type WorkspaceSession = Readonly<{ account: WorkspaceAccount; currentOrganizationId: string; organizations: readonly WorkspaceOrganization[] }>;
type WorkspaceContextValue = Readonly<{ account: WorkspaceAccount | null; compact: boolean; loading: boolean; organizationId: string; organizations: readonly WorkspaceOrganization[]; setCompact: Dispatch<SetStateAction<boolean>>; setOrganizationId: (organizationId: string) => void; setWorkspaceShopId: Dispatch<SetStateAction<string>>; workspaceShopId: string }>;
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children, initialSession = null }: Readonly<{ children: ReactNode; initialSession?: WorkspaceSession | null }>) {
  const router = useRouter();
  const initialOrganization = initialSession?.organizations.find(({ id }) => id === initialSession.currentOrganizationId) ?? initialSession?.organizations[0];
  const [organizationId, setOrganizationIdState] = useState(initialOrganization?.id ?? ""); const [workspaceShopId, setWorkspaceShopId] = useState(initialOrganization?.preference?.shopId ?? initialOrganization?.shops[0]?.id ?? ""); const account = initialSession?.account ?? null; const organizations = useMemo(() => initialSession?.organizations ?? [], [initialSession]); const loading = initialSession === null; const [compact, setCompact] = useState(initialOrganization?.preference?.isCompact ?? false);
  useEffect(() => { if (initialSession === null) { router.replace(`/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`); return; } if (initialSession.organizations.length === 0) router.replace("/onboarding"); }, [initialSession, router]);
  useEffect(() => { if (organizationId) window.localStorage.setItem("astu.workspace.organization", organizationId); }, [organizationId]);
  useEffect(() => { if (organizationId && workspaceShopId) window.localStorage.setItem(`astu.workspace.shop.${organizationId}`, workspaceShopId); }, [organizationId, workspaceShopId]);
  const setOrganizationId = useCallback((value: string) => { const organization = organizations.find(({ id }) => id === value); setOrganizationIdState(value); if (organization) { const preferredShop = organization.preference?.shopId ?? window.localStorage.getItem(`astu.workspace.shop.${organization.id}`); setWorkspaceShopId(organization.shops.find(({ id }) => id === preferredShop)?.id ?? organization.shops[0]?.id ?? ""); setCompact(organization.preference?.isCompact ?? false); void selectOrganizationAction(value).then(() => router.refresh()); } }, [organizations, router]);
  const value = useMemo(() => ({ account, compact, loading, organizationId, organizations, setCompact, setOrganizationId, setWorkspaceShopId, workspaceShopId }), [account, compact, loading, organizationId, organizations, setOrganizationId, workspaceShopId]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue { const context = useContext(WorkspaceContext); if (context === null) throw new Error("useWorkspace must be used within WorkspaceProvider."); return context; }
