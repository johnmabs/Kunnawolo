import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type {
  MembershipConsultationRepository,
  MembershipListItem,
} from "../application/ports/membership-consultation-repository";

export class PrismaMembershipConsultationRepository implements MembershipConsultationRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async list(
    organizationId: string,
  ): Promise<readonly MembershipListItem[]> {
    const rows = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        userAccount: true,
        invitation: {
          include: {
            deliveryOutbox: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        shopAssignments: true,
      },
      orderBy: [{ status: "asc" }, { userAccount: { displayName: "asc" } }],
    });
    return rows.map((row) => ({
      id: row.id,
      userAccountId: row.userAccountId,
      displayName: row.userAccount.displayName,
      email: row.userAccount.email,
      status: row.status as MembershipListItem["status"],
      role: row.role,
      invitedAt: row.invitedAt,
      invitationExpiresAt: row.invitation?.expiresAt ?? null,
      invitationId: row.invitation?.id ?? null,
      invitationDeliveryStatus:
        (row.invitation?.deliveryOutbox[0]?.status as
          MembershipListItem["invitationDeliveryStatus"] | undefined) ?? null,
      invitationDeliveryAttempts:
        row.invitation?.deliveryOutbox[0]?.attemptCount ?? 0,
      shopIds: row.shopAssignments.map(({ shopId }) => shopId),
    }));
  }
}
