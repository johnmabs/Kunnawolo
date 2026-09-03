"use server";

import { revalidatePath } from "next/cache";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { InviteMember } from "@/modules/identity-access/application/invite-member";
import { ProcessInvitationDelivery } from "@/modules/identity-access/application/process-invitation-delivery";
import { ResendMembershipInvitation } from "@/modules/identity-access/application/resend-membership-invitation";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaInvitationDeliveryOutbox } from "@/modules/identity-access/infrastructure/prisma-invitation-delivery-outbox";
import { PrismaMembershipInvitationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-invitation-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { configuredInvitationDelivery } from "@/app/api/_shared/configured-invitation-delivery";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";

type DeliveryOutcome = "email" | "manual" | "queued" | "failed";
export type InvitationActionState = Readonly<{
  acceptanceUrl: string | null;
  error: string | null;
  outcome: DeliveryOutcome | null;
  revision: number;
}>;

async function processDelivery(
  prisma: ReturnType<typeof createPrismaClient>,
  deliveryId: string,
): Promise<DeliveryOutcome> {
  const configured = configuredInvitationDelivery();
  if (configured === null) return "queued";
  const result = await new ProcessInvitationDelivery(
    new PrismaInvitationDeliveryOutbox(prisma),
    configured.delivery,
    new SystemClock(),
  ).execute(deliveryId);
  if (configured.mode === "manual") return "manual";
  return result === "SENT"
    ? "email"
    : result === "FAILED"
      ? "failed"
      : "queued";
}

export async function inviteMemberAction(
  previous: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const databaseUrl = process.env.DATABASE_URL;
  const organizationId = formData.get("organizationId");
  const email = formData.get("email");
  const displayName = formData.get("displayName");
  if (
    !databaseUrl ||
    typeof organizationId !== "string" ||
    typeof email !== "string" ||
    typeof displayName !== "string"
  )
    return {
      acceptanceUrl: null,
      error: "Vérifiez les informations du formulaire.",
      outcome: null,
      revision: previous.revision + 1,
    };
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (organization === null)
      return {
        acceptanceUrl: null,
        error: "L’organisation est introuvable.",
        outcome: null,
        revision: previous.revision + 1,
      };
    const opaqueTokens = new NodeOpaqueToken();
    const issued = await new InviteMember(
      new PrismaMembershipInvitationRepository(prisma),
      new UuidIdentifierGenerator(),
      opaqueTokens,
      opaqueTokens,
      new SystemClock(),
      process.env.APP_URL ?? "http://localhost:3000",
    ).execute({
      organizationId,
      invitedByActorId: account.id.value,
      email,
      displayName,
      organizationName: organization.name,
    });
    const outcome = await processDelivery(prisma, issued.deliveryId);
    revalidatePath("/administration/members");
    return {
      acceptanceUrl: outcome === "manual" ? issued.acceptanceUrl : null,
      error: null,
      outcome,
      revision: previous.revision + 1,
    };
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String(error.code)
        : "iam.invitation_failed";
    return {
      acceptanceUrl: null,
      error: code,
      outcome: null,
      revision: previous.revision + 1,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function resendInvitationAction(
  invitationId: string,
  previous: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const databaseUrl = process.env.DATABASE_URL;
  const organizationId = formData.get("organizationId");
  if (!databaseUrl || typeof organizationId !== "string")
    return {
      acceptanceUrl: null,
      error: "Contexte administratif indisponible.",
      outcome: null,
      revision: previous.revision + 1,
    };
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const opaqueTokens = new NodeOpaqueToken();
    const issued = await new ResendMembershipInvitation(
      new PrismaMembershipInvitationRepository(prisma),
      new UuidIdentifierGenerator(),
      opaqueTokens,
      opaqueTokens,
      new SystemClock(),
      process.env.APP_URL ?? "http://localhost:3000",
    ).execute({ organizationId, invitationId, actorId: account.id.value });
    const outcome = await processDelivery(prisma, issued.deliveryId);
    revalidatePath("/administration/members");
    return {
      acceptanceUrl: outcome === "manual" ? issued.acceptanceUrl : null,
      error: null,
      outcome,
      revision: previous.revision + 1,
    };
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String(error.code)
        : "iam.invitation_resend_failed";
    return {
      acceptanceUrl: null,
      error: code,
      outcome: null,
      revision: previous.revision + 1,
    };
  } finally {
    await prisma.$disconnect();
  }
}
