import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { AuthenticateWebSession } from "@/modules/identity-access/application/authenticate-web-session";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { DomainError } from "@/shared/domain/domain-error";
import { readSessionToken } from "./session-cookie";

export async function authenticateWebRequest(prisma: PrismaClient) {
  return new AuthenticateWebSession(
    new PrismaWebAuthenticationRepository(prisma),
    new NodeOpaqueToken(),
    new SystemClock(),
  ).execute(await readSessionToken());
}

export function assertTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : new URL(request.url).origin;
  if (origin !== expectedOrigin)
    throw new DomainError(
      "security.invalid_origin",
      "The request origin is not trusted.",
    );
}
