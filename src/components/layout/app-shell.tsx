"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, ToastProvider } from "@/components/ui";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useWorkspace, WorkspaceProvider, type WorkspaceSession } from "./workspace-context";

function AppShellContent({ children }: Readonly<{ children: ReactNode }>) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const { account, compact, organizationId, organizations, setOrganizationId, setWorkspaceShopId, workspaceShopId } = useWorkspace();
  const organization = organizations.find(({ id }) => id === organizationId);

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-background md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]" data-compact={compact}>
        <a className="fixed left-3 top-3 z-[110] -translate-y-20 rounded-md bg-surface px-4 py-3 font-semibold text-primary shadow-lg focus:translate-y-0" href="#main-content">Aller au contenu principal</a>
        <div className="sticky top-0 hidden h-dvh md:block"><Sidebar /></div>
        <div className="min-w-0">
          <Topbar
            onMenuOpen={() => setMobileNavigationOpen(true)}
            onOrganizationChange={setOrganizationId}
            onShopChange={setWorkspaceShopId}
            organizationId={organizationId}
            organizations={organizations}
            shopId={workspaceShopId}
            shops={organization?.shops ?? []}
            userLabel={account?.displayName ?? "Chargement…"}
          />
          <main id="main-content" tabIndex={-1}>{children}</main>
        </div>
      </div>
      <Drawer onOpenChange={setMobileNavigationOpen} open={mobileNavigationOpen}>
        <DrawerContent aria-describedby="mobile-navigation-description" aria-labelledby="mobile-navigation-title" className="left-0 right-auto w-[min(20rem,calc(100%-2rem))] border-l-0 border-r p-0">
          <DrawerTitle className="sr-only" id="mobile-navigation-title">Navigation</DrawerTitle>
          <DrawerDescription className="sr-only" id="mobile-navigation-description">Accéder aux différentes sections d’Astu Sales.</DrawerDescription>
          <Sidebar mobile onNavigate={() => setMobileNavigationOpen(false)} />
        </DrawerContent>
      </Drawer>
    </ToastProvider>
  );
}

export function AppShell({ children, initialSession }: Readonly<{ children: ReactNode; initialSession: WorkspaceSession | null }>) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/signup" || pathname === "/onboarding" || pathname.startsWith("/invitations/")) {
    return <ToastProvider>{children}</ToastProvider>;
  }
  return (
    <WorkspaceProvider initialSession={initialSession}>
      <AppShellContent>{children}</AppShellContent>
    </WorkspaceProvider>
  );
}
