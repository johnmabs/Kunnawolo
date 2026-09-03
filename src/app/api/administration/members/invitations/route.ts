import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { InviteMember } from "@/modules/identity-access/application/invite-member";
import { ConsoleInvitationDelivery } from "@/modules/identity-access/infrastructure/console-invitation-delivery";
import { ResendInvitationDelivery } from "@/modules/identity-access/infrastructure/resend-invitation-delivery";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../../_shared/api-error";
import { assertTrustedOrigin, authenticateWebRequest } from "../../../auth/_shared/web-session-access";
import { DomainError } from "@/shared/domain/domain-error";

function invitationDelivery() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (apiKey && from) return new ResendInvitationDelivery(apiKey, from, process.env.RESEND_REPLY_TO?.trim() || null);
  if (process.env.NODE_ENV === "production") throw new DomainError("iam.invitation_delivery_unavailable", "Resend is not configured.");
  return new ConsoleInvitationDelivery();
}

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
    const usesEmailDelivery = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
    const issued = await new InviteMember(new PrismaMembershipInvitationRepository(prisma), invitationDelivery(), new UuidIdentifierGenerator(), opaqueTokens, opaqueTokens, new SystemClock(), process.env.APP_URL ?? new URL(request.url).origin).execute({ organizationId: organization.id, invitedByActorId: account.id.value, email: input.email, displayName: input.displayName, organizationName: organization.name });
    return NextResponse.json({ email: issued.invitation.email, expiresAt: issued.invitation.expiresAt.toISOString(), delivery: usesEmailDelivery ? "email" : "manual", ...(usesEmailDelivery ? {} : { acceptanceUrl: issued.acceptanceUrl }) }, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError && error.code === "iam.invitation_delivery_unavailable") return NextResponse.json({ code: error.code }, { status: 503 });
    if (error instanceof DomainError && error.code === "iam.invitation_delivery_failed") return NextResponse.json({ code: error.code }, { status: 502 });
    return apiErrorResponse(error, "iam.invitation_failed");
  }
  finally { await prisma.$disconnect(); }
}
