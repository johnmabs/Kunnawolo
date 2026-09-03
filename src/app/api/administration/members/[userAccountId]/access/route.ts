import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UpdateMemberAccess } from "@/modules/identity-access/application/update-member-access";
import { PrismaAccessManagementRepository } from "@/modules/identity-access/infrastructure/prisma-access-management-repository";
import { apiErrorResponse } from "../../../../_shared/api-error";
import {
  assertTrustedOrigin,
  authenticateWebRequest,
} from "../../../../auth/_shared/web-session-access";

type Context = Readonly<{ params: Promise<{ userAccountId: string }> }>;

export async function PUT(request: Request, context: Context) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "iam.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const account = await authenticateWebRequest(prisma);
    const { userAccountId } = await context.params;
    const input = (await request.json()) as {
      organizationId?: unknown;
      role?: unknown;
      shopIds?: unknown;
    };
    if (
      typeof input.organizationId !== "string" ||
      typeof input.role !== "string" ||
      !Array.isArray(input.shopIds) ||
      input.shopIds.some((id) => typeof id !== "string")
    )
      return NextResponse.json(
        { code: "iam.invalid_access_request" },
        { status: 400 },
      );
    const member = await new UpdateMemberAccess(
      new PrismaAccessManagementRepository(prisma),
    ).execute({
      organizationId: input.organizationId,
      actorId: account.id.value,
      userAccountId,
      role: input.role,
      shopIds: input.shopIds as string[],
    });
    return NextResponse.json({
      userAccountId: member.userAccountId,
      role: member.role,
      shopIds: member.shopIds,
    });
  } catch (error) {
    return apiErrorResponse(error, "iam.access_update_failed");
  } finally {
    await prisma.$disconnect();
  }
}
