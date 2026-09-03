import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { MembershipInvitationRepository } from "../application/ports/membership-invitation-repository";
import { MembershipInvitation } from "../domain/membership-invitation";
import { OrganizationMembership } from "../domain/organization-membership";
import { UserAccount } from "../domain/user-account";

export class PrismaMembershipInvitationRepository implements MembershipInvitationRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async authorizeInvitation(organizationId: string, actorId: string) {
    const membership = await this.prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId, userAccountId: actorId } } });
    if (membership?.status !== "ACTIVE" || membership.role !== "OWNER") throw new DomainError("iam.invitation_forbidden", "Only an organization owner can invite members.");
  }
  public async findAccountByEmail(email: string) {
    const row = await this.prisma.userAccount.findUnique({ where: { email } });
    return row === null ? null : UserAccount.create(Identifier.fromString(row.id), row.email, row.displayName);
  }
  public async create(input: Parameters<MembershipInvitationRepository["create"]>[0]) {
    const duplicate = await this.prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId: input.membership.organizationId.value, userAccountId: input.account.id.value } } });
    if (duplicate !== null) throw new DomainError("iam.membership_taken", "This account is already a member or has a pending invitation.");
    await this.prisma.$transaction(async (transaction) => {
      if (input.createAccount) await transaction.userAccount.create({ data: { id: input.account.id.value, email: input.account.email, displayName: input.account.displayName } });
      await transaction.organizationMembership.create({ data: { id: input.membership.id.value, organizationId: input.membership.organizationId.value, userAccountId: input.membership.userAccountId.value, status: "INVITED", role: "CASHIER" } });
      await transaction.membershipInvitation.create({ data: { id: input.invitation.id.value, organizationId: input.invitation.organizationId.value, membershipId: input.invitation.membershipId.value, invitedByActorId: input.invitation.invitedByActorId.value, email: input.invitation.email, tokenHash: input.invitation.tokenHash, expiresAt: input.invitation.expiresAt } });
      await transaction.invitationDeliveryOutbox.create({ data: input.delivery });
      await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: input.invitation.organizationId.value, actorId: input.invitation.invitedByActorId.value, action: "membership.invited" } });
    });
  }
  public async findByTokenHash(tokenHash: string) {
    const row = await this.prisma.membershipInvitation.findUnique({ where: { tokenHash }, include: { organization: true, membership: { include: { userAccount: { include: { passwordCredential: true } } } } } });
    if (row === null) return null;
    const account = UserAccount.create(Identifier.fromString(row.membership.userAccount.id), row.membership.userAccount.email, row.membership.userAccount.displayName);
    return {
      account,
      hasCredential: row.membership.userAccount.passwordCredential !== null,
      organizationName: row.organization.name,
      invitation: MembershipInvitation.restore({ id: Identifier.fromString(row.id), organizationId: Identifier.fromString(row.organizationId), membershipId: Identifier.fromString(row.membershipId), invitedByActorId: Identifier.fromString(row.invitedByActorId), email: row.email, tokenHash: row.tokenHash, expiresAt: row.expiresAt, acceptedAt: row.acceptedAt }),
      membership: OrganizationMembership.invite(Identifier.fromString(row.membership.id), Identifier.fromString(row.membership.organizationId), Identifier.fromString(row.membership.userAccountId)),
    };
  }
  public async accept(input: Parameters<MembershipInvitationRepository["accept"]>[0]) {
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.membershipInvitation.updateMany({ where: { id: input.invitation.id.value, acceptedAt: null, expiresAt: { gt: input.invitation.acceptedAt! } }, data: { acceptedAt: input.invitation.acceptedAt } });
      if (updated.count !== 1) throw new DomainError("auth.invitation_invalid", "The invitation is invalid or expired.");
      await transaction.organizationMembership.update({ where: { id: input.membership.id.value }, data: { status: "ACTIVE", activatedAt: input.invitation.acceptedAt } });
      if (input.credential !== null) await transaction.passwordCredential.create({ data: { userAccountId: input.membership.userAccountId.value, ...input.credential } });
      await transaction.invitationDeliveryOutbox.updateMany({ where: { invitationId: input.invitation.id.value, status: { in: ["PENDING", "PROCESSING", "FAILED"] } }, data: { status: "CANCELLED", acceptanceUrl: null, lockedAt: null } });
      await transaction.organizationAudit.create({ data: { id: crypto.randomUUID(), organizationId: input.membership.organizationId.value, actorId: input.membership.userAccountId.value, action: "membership.invitation_accepted" } });
    });
  }
}
