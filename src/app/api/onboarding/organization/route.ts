import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { CreateOwnedOrganization } from "@/modules/organization/application/create-owned-organization";
import { PrismaOrganizationOnboardingRepository } from "@/modules/organization/infrastructure/prisma-organization-onboarding-repository";
import { apiErrorResponse } from "../../_shared/api-error";
import {
  assertTrustedOrigin,
  authenticateWebRequest,
} from "../../auth/_shared/web-session-access";

export async function POST(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json(
      { code: "organization.unavailable" },
      { status: 503 },
    );
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const account = await authenticateWebRequest(prisma);
    const input = (await request.json()) as {
      name?: unknown;
      currency?: unknown;
      shopName?: unknown;
      shopCode?: unknown;
    };
    if (
      typeof input.name !== "string" ||
      typeof input.currency !== "string" ||
      typeof input.shopName !== "string" ||
      typeof input.shopCode !== "string"
    )
      return NextResponse.json(
        { code: "organization.invalid_request" },
        { status: 400 },
      );
    const created = await new CreateOwnedOrganization(
      new PrismaOrganizationOnboardingRepository(prisma),
      new UuidIdentifierGenerator(),
    ).execute({
      name: input.name,
      currency: input.currency,
      ownerUserAccountId: account.id.value,
      shopName: input.shopName,
      shopCode: input.shopCode,
    });
    return NextResponse.json(
      {
        id: created.organization.id.value,
        name: created.organization.name,
        currency: created.organization.currency,
        role: "OWNER",
        initialShop: {
          id: created.initialShop.id.value,
          name: created.initialShop.name,
          code: created.initialShop.code,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "organization.creation_failed");
  } finally {
    await prisma.$disconnect();
  }
}
