"use client";

import { useState, type ReactNode } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, ToastProvider } from "@/components/ui";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type AppShellProps = Readonly<{
  children: ReactNode;
  organizationLabel: string;
  shopLabel: string;
  userLabel: string;
}>;

export function AppShell({ children, organizationLabel, shopLabel, userLabel }: AppShellProps) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-background md:grid md:grid-cols-[4.5rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="sticky top-0 hidden h-dvh md:block"><Sidebar /></div>
        <div className="min-w-0">
          <Topbar onMenuOpen={() => setMobileNavigationOpen(true)} organizationLabel={organizationLabel} shopLabel={shopLabel} userLabel={userLabel} />
          <main>{children}</main>
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
