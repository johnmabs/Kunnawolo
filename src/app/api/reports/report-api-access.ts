import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { AuthenticateApiKey, type ApiAccessContext } from "@/modules/identity-access/application/authenticate-api-key";
import { NodeApiSecretHasher } from "@/modules/identity-access/infrastructure/node-api-secret";
import { PrismaApiAccessKeyRepository } from "@/modules/identity-access/infrastructure/prisma-api-access-key-repository";
import { PrismaApiKeyAccessAuthorization } from "@/modules/identity-access/infrastructure/prisma-api-key-access-authorization";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { DomainError } from "@/shared/domain/domain-error";

export async function authenticateReportRequest(prisma: PrismaClient, authorization: string | null, organizationId: string): Promise<ApiAccessContext> {
  if (authorization === null || !authorization.startsWith("Bearer ")) throw new DomainError("security.invalid_api_key", "A bearer API key is required.");
  const context = await new AuthenticateApiKey(new PrismaApiAccessKeyRepository(prisma), new PrismaApiKeyAccessAuthorization(prisma), new NodeApiSecretHasher(), new SystemClock()).execute(authorization.slice("Bearer ".length));
  if (context.organizationId !== organizationId) throw new DomainError("security.tenant_mismatch", "The API key does not belong to this organization.");
  return context;
}
