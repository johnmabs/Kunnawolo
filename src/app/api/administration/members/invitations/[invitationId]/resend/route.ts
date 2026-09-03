import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { ProcessInvitationDelivery } from "@/modules/identity-access/application/process-invitation-delivery";
import { ResendMembershipInvitation } from "@/modules/identity-access/application/resend-membership-invitation";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaInvitationDeliveryOutbox } from "@/modules/identity-access/infrastructure/prisma-invitation-delivery-outbox";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "@/app/api/_shared/api-error";
import { configuredInvitationDelivery } from "@/app/api/_shared/configured-invitation-delivery";
import {
  assertTrustedOrigin,
  authenticateWebRequest,
} from "@/app/api/auth/_shared/web-session-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ invitationId: string }> },
) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    return NextResponse.json({ code: "iam.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const account = await authenticateWebRequest(prisma);
    const input = (await request.json()) as { organizationId?: unknown };
    if (typeof input.organizationId !== "string")
      return NextResponse.json(
        { code: "iam.invalid_invitation_request" },
        { status: 400 },
      );
    const { invitationId } = await context.params;
    const opaqueTokens = new NodeOpaqueToken();
    const issued = await new ResendMembershipInvitation(
      new PrismaMembershipInvitationRepository(prisma),
      new UuidIdentifierGenerator(),
      opaqueTokens,
      opaqueTokens,
      new SystemClock(),
      process.env.APP_URL ?? new URL(request.url).origin,
    ).execute({
      organizationId: input.organizationId,
      invitationId,
      actorId: account.id.value,
    });
    const configured = configuredInvitationDelivery();
    const result =
      configured === null
        ? "IDLE"
        : await new ProcessInvitationDelivery(
            new PrismaInvitationDeliveryOutbox(prisma),
            configured.delivery,
            new SystemClock(),
          ).execute(issued.deliveryId);
    const delivery =
      configured?.mode === "manual"
        ? "manual"
        : result === "SENT"
          ? "email"
          : result === "FAILED"
            ? "failed"
            : "queued";
    return NextResponse.json({
      expiresAt: issued.invitation.expiresAt.toISOString(),
      delivery,
      ...(configured?.mode === "manual"
        ? { acceptanceUrl: issued.acceptanceUrl }
        : {}),
    });
  } catch (error) {
    return apiErrorResponse(error, "iam.invitation_resend_failed");
  } finally {
    await prisma.$disconnect();
  }
}
