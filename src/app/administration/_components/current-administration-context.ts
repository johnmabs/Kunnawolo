import "server-only";
import { cookies } from "next/headers";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";

export async function currentAdministrationContext() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const preferred = (await cookies()).get("astu_organization")?.value;
    const memberships = await prisma.organizationMembership.findMany({
      where: { userAccountId: account.id.value, status: "ACTIVE" },
      include: { organization: true, shopAssignments: true },
      orderBy: { organization: { name: "asc" } },
    });
    const membership =
      memberships.find(({ organizationId }) => organizationId === preferred) ??
      memberships[0];
    return membership
      ? {
          accountId: account.id.value,
          organization: {
            id: membership.organization.id,
            name: membership.organization.name,
            currency: membership.organization.currency,
          },
          role: membership.role,
          assignedShopIds: membership.shopAssignments.map(
            ({ shopId }) => shopId,
          ),
        }
      : null;
  } catch {
    return null;
  } finally {
    await prisma.$disconnect();
  }
}
