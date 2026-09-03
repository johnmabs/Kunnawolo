import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { IdentityRepository } from "../application/ports/identity-repository";
import type { OrganizationMembership } from "../domain/organization-membership";
import type { UserAccount } from "../domain/user-account";

export class PrismaIdentityRepository implements IdentityRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async saveAccount(account: UserAccount): Promise<void> {
    await this.prisma.userAccount.upsert({
      where: { id: account.id.value },
      create: {
        id: account.id.value,
        email: account.email,
        displayName: account.displayName,
      },
      update: { email: account.email, displayName: account.displayName },
    });
  }
  public async saveMembership(
    membership: OrganizationMembership,
  ): Promise<void> {
    await this.prisma.organizationMembership.upsert({
      where: {
        organizationId_userAccountId: {
          organizationId: membership.organizationId.value,
          userAccountId: membership.userAccountId.value,
        },
      },
      create: {
        id: membership.id.value,
        organizationId: membership.organizationId.value,
        userAccountId: membership.userAccountId.value,
        status: membership.status,
      },
      update: {
        status: membership.status,
        activatedAt: membership.status === "ACTIVE" ? new Date() : null,
        deactivatedAt: membership.status === "INACTIVE" ? new Date() : null,
      },
    });
  }
}
