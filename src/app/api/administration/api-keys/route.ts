import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { IssueOrganizationApiKey } from "@/modules/identity-access/application/issue-organization-api-key";
import {
  NodeApiSecretGenerator,
  NodeApiSecretHasher,
} from "@/modules/identity-access/infrastructure/node-api-secret";
import { PrismaApiAccessKeyRepository } from "@/modules/identity-access/infrastructure/prisma-api-access-key-repository";
import { PrismaApiKeyAccessAuthorization } from "@/modules/identity-access/infrastructure/prisma-api-key-access-authorization";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../_shared/api-access";
import { apiErrorResponse } from "../../_shared/api-error";

type IssueRequest = Readonly<{
  organizationId?: string;
  label?: string;
  expiresAt?: string | null;
}>;

export async function POST(request: Request) {
  const input = (await request.json()) as IssueRequest;
  const organizationId = input.organizationId?.trim();
  const label = input.label?.trim();
  if (!organizationId || !label)
    return NextResponse.json(
      { code: "security.invalid_api_key_request" },
      { status: 400 },
    );
  const expiresAt = input.expiresAt
    ? new Date(`${input.expiresAt}T23:59:59.999Z`)
    : null;
  if (expiresAt !== null && Number.isNaN(expiresAt.valueOf()))
    return NextResponse.json(
      { code: "security.invalid_api_key_expiry" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "security.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(
      prisma,
      request.headers.get("authorization"),
      organizationId,
    );
    const issued = await new IssueOrganizationApiKey(
      new PrismaApiAccessKeyRepository(prisma),
      new PrismaApiKeyAccessAuthorization(prisma),
      new UuidIdentifierGenerator(),
      new NodeApiSecretGenerator(),
      new NodeApiSecretHasher(),
      new SystemClock(),
    ).execute({ organizationId, actorId: access.actorId, label, expiresAt });
    return NextResponse.json(
      {
        id: issued.key.id.value,
        label: issued.key.label,
        expiresAt: issued.key.expiresAt,
        token: issued.token,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, "security.api_key_issue_failed");
  } finally {
    await prisma.$disconnect();
  }
}
