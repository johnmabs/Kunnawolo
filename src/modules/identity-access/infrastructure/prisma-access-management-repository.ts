import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import type {
  AccessManagementRepository,
  AccessMember,
} from "../application/ports/access-management-repository";

export class PrismaAccessManagementRepository implements AccessManagementRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findMember(
    organizationId: string,
    userAccountId: string,
  ): Promise<AccessMember | null> {
    const row = await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userAccountId: { organizationId, userAccountId },
      },
      include: { shopAssignments: true },
    });
    return row === null
      ? null
      : {
          id: row.id,
          organizationId: row.organizationId,
          userAccountId: row.userAccountId,
          status: row.status as AccessMember["status"],
          role: row.role as AccessMember["role"],
          shopIds: row.shopAssignments.map(({ shopId }) => shopId),
        };
  }

  public async findActiveShopIds(organizationId: string) {
    return (
      await this.prisma.shop.findMany({
        where: { organizationId, isActive: true },
        select: { id: true },
      })
    ).map(({ id }) => id);
  }

  public async updateAtomically(
    input: Parameters<AccessManagementRepository["updateAtomically"]>[0],
  ): Promise<void> {
    await this.prisma.$transaction(
      async (transaction) => {
        const actor = await transaction.organizationMembership.findUnique({
          where: {
            organizationId_userAccountId: {
              organizationId: input.member.organizationId,
              userAccountId: input.actorId,
            },
          },
        });
        if (actor?.status !== "ACTIVE" || actor.role !== "OWNER")
          throw new DomainError(
            "iam.access_management_forbidden",
            "Only an active organization owner can manage access.",
          );
        if (input.previousRole === "OWNER" && input.member.role !== "OWNER") {
          const ownerCount = await transaction.organizationMembership.count({
            where: {
              organizationId: input.member.organizationId,
              status: "ACTIVE",
              role: "OWNER",
            },
          });
          if (ownerCount <= 1)
            throw new DomainError(
              "iam.last_owner_required",
              "The last active owner cannot be demoted.",
            );
        }
        await transaction.organizationMembership.update({
          where: { id: input.member.id },
          data: { role: input.member.role },
        });
        await transaction.shopAssignment.deleteMany({
          where: { membershipId: input.member.id },
        });
        if (input.member.shopIds.length > 0)
          await transaction.shopAssignment.createMany({
            data: input.member.shopIds.map((shopId) => ({
              id: crypto.randomUUID(),
              membershipId: input.member.id,
              shopId,
            })),
          });
        await transaction.organizationAudit.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: input.member.organizationId,
            actorId: input.actorId,
            action: "membership.access_updated",
            metadata: {
              userAccountId: input.member.userAccountId,
              role: input.member.role,
              shopIds: input.member.shopIds,
            },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  }
}
