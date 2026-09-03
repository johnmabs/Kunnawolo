"use server";

import { redirect, RedirectType } from "next/navigation";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { AcceptMembershipInvitation } from "@/modules/identity-access/application/accept-membership-invitation";
import { IssueWebSession } from "@/modules/identity-access/application/issue-web-session";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { NodePasswordHasher } from "@/modules/identity-access/infrastructure/node-password-hasher";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";
import { writeSessionCookie } from "@/app/api/auth/_shared/session-cookie";

export type InvitationAcceptanceState = Readonly<{ error: string | null }>;

export async function acceptInvitationAction(token: string, _previous: InvitationAcceptanceState, formData: FormData): Promise<InvitationAcceptanceState> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return { error: "Le service d’invitation est momentanément indisponible." };
  const password = formData.get("password");
  const prisma = createPrismaClient(databaseUrl);
  let loginRequired = false;
  try {
    let authenticatedUserAccountId: string | null = null;
    try { authenticatedUserAccountId = (await authenticateWebRequest(prisma)).id.value; } catch { /* A new invited account has no session yet. */ }
    const result = await new AcceptMembershipInvitation(new PrismaMembershipInvitationRepository(prisma), new NodeOpaqueToken(), new NodePasswordHasher(), new SystemClock()).execute({ token, password: typeof password === "string" && password.length > 0 ? password : null, authenticatedUserAccountId });
    if (result.shouldIssueSession) {
      const opaqueTokens = new NodeOpaqueToken();
      const session = await new IssueWebSession(new PrismaWebAuthenticationRepository(prisma), new UuidIdentifierGenerator(), opaqueTokens, opaqueTokens, new SystemClock()).execute(result.account.id.value);
      await writeSessionCookie(session.token, session.expiresAt);
    }
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";
    if (code === "auth.invitation_login_required") loginRequired = true;
    else if (code === "auth.password_too_short") return { error: "Choisissez une phrase de passe d’au moins 15 caractères." };
    else return { error: "L’invitation n’a pas pu être acceptée. Le lien est peut-être expiré." };
  } finally {
    await prisma.$disconnect();
  }
  if (loginRequired) redirect(`/login?next=${encodeURIComponent(`/invitations/${token}`)}`);
  redirect("/", RedirectType.replace);
}
