import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { InviteMember } from "@/modules/identity-access/application/invite-member";
import { ProcessInvitationDelivery } from "@/modules/identity-access/application/process-invitation-delivery";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaInvitationDeliveryOutbox } from "@/modules/identity-access/infrastructure/prisma-invitation-delivery-outbox";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { configuredInvitationDelivery } from "../../../_shared/configured-invitation-delivery";
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
    const issued = await new InviteMember(new PrismaMembershipInvitationRepository(prisma), new UuidIdentifierGenerator(), opaqueTokens, opaqueTokens, new SystemClock(), process.env.APP_URL ?? new URL(request.url).origin).execute({ organizationId: organization.id, invitedByActorId: account.id.value, email: input.email, displayName: input.displayName, organizationName: organization.name });
    const configured = configuredInvitationDelivery();
    const result = configured === null ? "IDLE" : await new ProcessInvitationDelivery(new PrismaInvitationDeliveryOutbox(prisma), configured.delivery, new SystemClock()).execute(issued.deliveryId);
    const delivery = configured?.mode === "manual" ? "manual" : result === "SENT" ? "email" : result === "FAILED" ? "failed" : "queued";
    return NextResponse.json({ email: issued.invitation.email, expiresAt: issued.invitation.expiresAt.toISOString(), delivery, ...(configured?.mode === "manual" ? { acceptanceUrl: issued.acceptanceUrl } : {}) }, { status: 201 });
  } catch (error) { return apiErrorResponse(error, "iam.invitation_failed"); }
  finally { await prisma.$disconnect(); }
}
