import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { queryWorkspaceSession } from "@/modules/identity-access/infrastructure/prisma-workspace-session-query";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astu Sales",
  description: "Gestionnaire de ventes et de stocks.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const databaseUrl = process.env.DATABASE_URL;
  let initialSession = null;
  if (databaseUrl) {
    const prisma = createPrismaClient(databaseUrl);
    try { initialSession = await queryWorkspaceSession(prisma, await authenticateWebRequest(prisma)); }
    catch { /* Public routes and expired sessions render without workspace data. */ }
    finally { await prisma.$disconnect(); }
  }
  return (
    <html lang="fr">
      <body><AppShell initialSession={initialSession}>{children}</AppShell></body>
    </html>
  );
}
