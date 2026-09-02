"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

type WorkspaceContextValue = Readonly<{
  apiKey: string;
  compact: boolean;
  organizationId: string;
  setApiKey: Dispatch<SetStateAction<string>>;
  setCompact: Dispatch<SetStateAction<boolean>>;
  setOrganizationId: Dispatch<SetStateAction<string>>;
  setWorkspaceShopId: Dispatch<SetStateAction<string>>;
  workspaceShopId: string;
}>;

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [organizationId, setOrganizationId] = useState("");
  const [workspaceShopId, setWorkspaceShopId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [compact, setCompact] = useState(false);
  const value = useMemo(() => ({ apiKey, compact, organizationId, setApiKey, setCompact, setOrganizationId, setWorkspaceShopId, workspaceShopId }), [apiKey, compact, organizationId, workspaceShopId]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (context === null) throw new Error("useWorkspace must be used within WorkspaceProvider.");
  return context;
}
