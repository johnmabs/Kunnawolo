import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { AuthenticateApiKey, type ApiAccessContext } from "@/modules/identity-access/application/authenticate-api-key";
import { NodeApiSecretHasher } from "@/modules/identity-access/infrastructure/node-api-secret";
import { PrismaApiAccessKeyRepository } from "@/modules/identity-access/infrastructure/prisma-api-access-key-repository";
import { PrismaApiKeyAccessAuthorization } from "@/modules/identity-access/infrastructure/prisma-api-key-access-authorization";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateWebRequest } from "../auth/_shared/web-session-access";

export async function authenticateApiRequest(prisma: PrismaClient, authorization: string | null, organizationId: string): Promise<ApiAccessContext> {
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (bearer.length > 0) {
    const context = await new AuthenticateApiKey(new PrismaApiAccessKeyRepository(prisma), new PrismaApiKeyAccessAuthorization(prisma), new NodeApiSecretHasher(), new SystemClock()).execute(bearer);
    if (context.organizationId !== organizationId) throw new DomainError("security.tenant_mismatch", "The API key does not belong to this organization.");
    return context;
  }
  const account = await authenticateWebRequest(prisma);
  const membership = await prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId, userAccountId: account.id.value } } });
  if (membership?.status !== "ACTIVE") throw new DomainError("security.tenant_mismatch", "The account is not active in this organization.");
  return { organizationId, actorId: account.id.value };
}
