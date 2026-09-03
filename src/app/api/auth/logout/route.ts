import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { LogoutWebSession } from "@/modules/identity-access/application/logout-web-session";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { apiErrorResponse } from "../../_shared/api-error";
import { assertTrustedOrigin } from "../_shared/web-session-access";
import {
  clearSessionCookie,
  readSessionToken,
} from "../_shared/session-cookie";

export async function POST(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "auth.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    await new LogoutWebSession(
      new PrismaWebAuthenticationRepository(prisma),
      new NodeOpaqueToken(),
      new SystemClock(),
    ).execute(await readSessionToken());
    await clearSessionCookie();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiErrorResponse(error, "auth.logout_failed");
  } finally {
    await prisma.$disconnect();
  }
}
