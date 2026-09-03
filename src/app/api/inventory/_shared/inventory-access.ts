import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { authenticateApiRequest } from "../../_shared/api-access";

export async function authorizeInventoryShop(
  prisma: PrismaClient,
  request: Request,
  organizationId: string,
  shopId: string,
) {
  const access = await authenticateApiRequest(
    prisma,
    request.headers.get("authorization"),
    organizationId,
  );
  await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(
    organizationId,
    access.actorId,
    shopId,
  );
  return access;
}
