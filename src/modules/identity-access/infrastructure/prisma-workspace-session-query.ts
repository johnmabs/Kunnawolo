import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { UserAccount } from "../domain/user-account";

export async function queryWorkspaceSession(
  prisma: PrismaClient,
  account: UserAccount,
  preferredOrganizationId: string | null = null,
) {
  const [memberships, preferences] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { userAccountId: account.id.value, status: "ACTIVE" },
      include: {
        organization: { include: { shops: true } },
        shopAssignments: { include: { shop: true } },
      },
      orderBy: { organization: { name: "asc" } },
    }),
    prisma.workspacePreference.findMany({
      where: { actorId: account.id.value },
    }),
  ]);
  const organizations = memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    currency: membership.organization.currency,
    role: membership.role,
    preference: (() => {
      const preference = preferences.find(
        ({ organizationId }) => organizationId === membership.organizationId,
      );
      return preference
        ? { shopId: preference.shopId, isCompact: preference.isCompact }
        : null;
    })(),
    shops: (membership.role === "OWNER"
      ? membership.organization.shops
      : membership.shopAssignments.map(({ shop }) => shop)
    )
      .filter(({ isActive }) => isActive)
      .sort((left, right) => left.name.localeCompare(right.name, "fr"))
      .map((shop) => ({ id: shop.id, name: shop.name, code: shop.code })),
  }));
  return {
    account: {
      id: account.id.value,
      email: account.email,
      displayName: account.displayName,
    },
    currentOrganizationId: organizations.some(
      ({ id }) => id === preferredOrganizationId,
    )
      ? preferredOrganizationId!
      : (organizations[0]?.id ?? ""),
    organizations,
  };
}
