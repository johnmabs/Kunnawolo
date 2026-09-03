import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth";
import { InvitationAcceptance } from "./invitation-acceptance";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { GetMembershipInvitation } from "@/modules/identity-access/application/get-membership-invitation";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";

export const metadata: Metadata = { title: "Accepter l’invitation · Astu Sales" };
export default async function InvitationPage({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  const databaseUrl = process.env.DATABASE_URL;
  let details = null;
  if (databaseUrl) {
    const prisma = createPrismaClient(databaseUrl);
    try {
      const invitation = await new GetMembershipInvitation(new PrismaMembershipInvitationRepository(prisma), new NodeOpaqueToken(), new SystemClock()).execute(token);
      details = { email: invitation.account.email, displayName: invitation.account.displayName, organizationName: invitation.organizationName, expiresAt: invitation.invitation.expiresAt.toISOString(), requiresPassword: !invitation.hasCredential };
    } catch { /* Invalid invitations render a stable error state. */ }
    finally { await prisma.$disconnect(); }
  }
  return <AuthLayout description="Vérifiez les informations ci-dessous avant de rejoindre l’espace de travail." eyebrow="Invitation" title="Rejoindre une organisation"><InvitationAcceptance details={details} token={token} /></AuthLayout>;
}
