import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListMembers } from "@/modules/identity-access/application/list-members";
import { PrismaMembershipConsultationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-consultation-repository";
import { apiErrorResponse } from "../../_shared/api-error";
import { authenticateWebRequest } from "../../auth/_shared/web-session-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams
    .get("organizationId")
    ?.trim();
  if (!organizationId)
    return NextResponse.json(
      { code: "iam.invalid_membership_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "iam.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const access = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userAccountId: {
          organizationId,
          userAccountId: account.id.value,
        },
      },
    });
    if (access?.status !== "ACTIVE" || access.role !== "OWNER")
      return NextResponse.json(
        { code: "iam.membership_list_forbidden" },
        { status: 403 },
      );
    const items = await new ListMembers(
      new PrismaMembershipConsultationRepository(prisma),
    ).execute(organizationId);
    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        invitedAt: item.invitedAt.toISOString(),
        invitationExpiresAt: item.invitationExpiresAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return apiErrorResponse(error, "iam.membership_list_failed");
  } finally {
    await prisma.$disconnect();
  }
}
