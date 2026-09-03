import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { MembershipConsultationRepository, MembershipListItem } from "../application/ports/membership-consultation-repository";

export class PrismaMembershipConsultationRepository implements MembershipConsultationRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async list(organizationId: string): Promise<readonly MembershipListItem[]> {
    const rows = await this.prisma.organizationMembership.findMany({ where: { organizationId }, include: { userAccount: true, invitation: true }, orderBy: [{ status: "asc" }, { userAccount: { displayName: "asc" } }] });
    return rows.map((row) => ({ id: row.id, userAccountId: row.userAccountId, displayName: row.userAccount.displayName, email: row.userAccount.email, status: row.status as MembershipListItem["status"], role: row.role, invitedAt: row.invitedAt, invitationExpiresAt: row.invitation?.expiresAt ?? null }));
  }
}
