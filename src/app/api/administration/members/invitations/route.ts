import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { InviteMember } from "@/modules/identity-access/application/invite-member";
import { ConsoleInvitationDelivery } from "@/modules/identity-access/infrastructure/console-invitation-delivery";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../../_shared/api-error";
import { assertTrustedOrigin, authenticateWebRequest } from "../../../auth/_shared/web-session-access";

export async function POST(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "iam.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const account = await authenticateWebRequest(prisma);
    const input = await request.json() as { organizationId?: unknown; email?: unknown; displayName?: unknown };
    if (typeof input.organizationId !== "string" || typeof input.email !== "string" || typeof input.displayName !== "string") return NextResponse.json({ code: "iam.invalid_invitation_request" }, { status: 400 });
    const organization = await prisma.organization.findUnique({ where: { id: input.organizationId } });
    if (organization === null) return NextResponse.json({ code: "organization.not_found" }, { status: 404 });
    const opaqueTokens = new NodeOpaqueToken();
    const issued = await new InviteMember(new PrismaMembershipInvitationRepository(prisma), new ConsoleInvitationDelivery(), new UuidIdentifierGenerator(), opaqueTokens, opaqueTokens, new SystemClock(), process.env.APP_URL ?? new URL(request.url).origin).execute({ organizationId: organization.id, invitedByActorId: account.id.value, email: input.email, displayName: input.displayName, organizationName: organization.name });
    return NextResponse.json({ email: issued.invitation.email, expiresAt: issued.invitation.expiresAt.toISOString(), acceptanceUrl: issued.acceptanceUrl }, { status: 201 });
  } catch (error) { return apiErrorResponse(error, "iam.invitation_failed"); }
  finally { await prisma.$disconnect(); }
}
