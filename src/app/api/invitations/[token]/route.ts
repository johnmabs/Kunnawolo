import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { AcceptMembershipInvitation } from "@/modules/identity-access/application/accept-membership-invitation";
import { GetMembershipInvitation } from "@/modules/identity-access/application/get-membership-invitation";
import { IssueWebSession } from "@/modules/identity-access/application/issue-web-session";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { NodePasswordHasher } from "@/modules/identity-access/infrastructure/node-password-hasher";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../_shared/api-error";
import {
  assertTrustedOrigin,
  authenticateWebRequest,
} from "../../auth/_shared/web-session-access";
import { writeSessionCookie } from "../../auth/_shared/session-cookie";

type Context = Readonly<{ params: Promise<{ token: string }> }>;
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: Context) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "auth.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const { token } = await context.params;
    const details = await new GetMembershipInvitation(
      new PrismaMembershipInvitationRepository(prisma),
      new NodeOpaqueToken(),
      new SystemClock(),
    ).execute(token);
    return NextResponse.json({
      email: details.account.email,
      displayName: details.account.displayName,
      organizationName: details.organizationName,
      expiresAt: details.invitation.expiresAt.toISOString(),
      requiresPassword: !details.hasCredential,
    });
  } catch (error) {
    return apiErrorResponse(error, "auth.invitation_read_failed");
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: Request, context: Context) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "auth.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const { token } = await context.params;
    const input = (await request.json()) as { password?: unknown };
    let authenticatedUserAccountId: string | null = null;
    try {
      authenticatedUserAccountId = (await authenticateWebRequest(prisma)).id
        .value;
    } catch {
      /* A new invited account is not authenticated yet. */
    }
    const result = await new AcceptMembershipInvitation(
      new PrismaMembershipInvitationRepository(prisma),
      new NodeOpaqueToken(),
      new NodePasswordHasher(),
      new SystemClock(),
    ).execute({
      token,
      password: typeof input.password === "string" ? input.password : null,
      authenticatedUserAccountId,
    });
    if (result.shouldIssueSession) {
      const opaqueTokens = new NodeOpaqueToken();
      const session = await new IssueWebSession(
        new PrismaWebAuthenticationRepository(prisma),
        new UuidIdentifierGenerator(),
        opaqueTokens,
        opaqueTokens,
        new SystemClock(),
      ).execute(result.account.id.value);
      await writeSessionCookie(session.token, session.expiresAt);
    }
    return NextResponse.json({ organizationId: result.organizationId });
  } catch (error) {
    return apiErrorResponse(error, "auth.invitation_acceptance_failed");
  } finally {
    await prisma.$disconnect();
  }
}
