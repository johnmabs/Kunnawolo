import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { IssueWebSession } from "@/modules/identity-access/application/issue-web-session";
import { RegisterWithPassword } from "@/modules/identity-access/application/register-with-password";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { NodePasswordHasher } from "@/modules/identity-access/infrastructure/node-password-hasher";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../_shared/api-error";
import { assertTrustedOrigin } from "../_shared/web-session-access";
import { writeSessionCookie } from "../_shared/session-cookie";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "auth.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const input = await request.json() as { email?: unknown; displayName?: unknown; password?: unknown };
    if (typeof input.email !== "string" || typeof input.displayName !== "string" || typeof input.password !== "string") return NextResponse.json({ code: "auth.invalid_request" }, { status: 400 });
    const repository = new PrismaWebAuthenticationRepository(prisma);
    const account = await new RegisterWithPassword(repository, new NodePasswordHasher(), new UuidIdentifierGenerator()).execute(input as { email: string; displayName: string; password: string });
    const opaqueTokens = new NodeOpaqueToken();
    const session = await new IssueWebSession(repository, new UuidIdentifierGenerator(), opaqueTokens, opaqueTokens, new SystemClock()).execute(account.id.value);
    await writeSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ account: { id: account.id.value, email: account.email, displayName: account.displayName } }, { status: 201 });
  } catch (error) { return apiErrorResponse(error, "auth.registration_failed"); }
  finally { await prisma.$disconnect(); }
}
