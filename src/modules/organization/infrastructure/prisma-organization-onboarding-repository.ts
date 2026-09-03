import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { OrganizationOnboardingRepository } from "../application/ports/organization-onboarding-repository";

export class PrismaOrganizationOnboardingRepository implements OrganizationOnboardingRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async createWithOwner(input: Parameters<OrganizationOnboardingRepository["createWithOwner"]>[0]): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.organization.create({
        data: { id: input.organization.id.value, name: input.organization.name, currency: input.organization.currency },
      });
      await transaction.shop.create({
        data: { id: input.initialShop.id.value, organizationId: input.organization.id.value, code: input.initialShop.code, name: input.initialShop.name, isActive: true },
      });
      await transaction.organizationMembership.create({
        data: {
          id: input.membershipId,
          organizationId: input.organization.id.value,
          userAccountId: input.ownerUserAccountId,
          status: "ACTIVE",
          role: "OWNER",
          activatedAt: new Date(),
        },
      });
      await transaction.organizationAudit.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: input.organization.id.value,
          actorId: input.ownerUserAccountId,
          action: "organization.created",
        },
      });
      await transaction.organizationAudit.create({
        data: { id: crypto.randomUUID(), organizationId: input.organization.id.value, actorId: input.ownerUserAccountId, action: "shop.created" },
      });
    });
  }
}
