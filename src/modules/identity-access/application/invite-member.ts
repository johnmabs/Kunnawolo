import { OrganizationMembership } from "../domain/organization-membership";
import { MembershipInvitation } from "../domain/membership-invitation";
import { UserAccount } from "../domain/user-account";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { Identifier } from "@/shared/domain/identifier";
import type { Clock } from "@/shared/domain/clock";
import type { OpaqueTokenGenerator, OpaqueTokenHasher } from "./ports/opaque-token";
import type { MembershipInvitationRepository } from "./ports/membership-invitation-repository";
import type { InvitationDelivery } from "./ports/invitation-delivery";

export class InviteMember {
  public constructor(private readonly repository: MembershipInvitationRepository, private readonly delivery: InvitationDelivery, private readonly ids: IdentifierGenerator, private readonly tokens: OpaqueTokenGenerator, private readonly tokenHasher: OpaqueTokenHasher, private readonly clock: Clock, private readonly applicationUrl: string) {}
  public async execute(input: Readonly<{ organizationId: string; invitedByActorId: string; email: string; displayName: string; organizationName: string }>) {
    await this.repository.authorizeInvitation(input.organizationId, input.invitedByActorId);
    const candidate = UserAccount.create(this.ids.next(), input.email, input.displayName);
    const existing = await this.repository.findAccountByEmail(candidate.email);
    const account = existing ?? candidate;
    const membership = OrganizationMembership.invite(this.ids.next(), Identifier.fromString(input.organizationId), account.id);
    const issuedAt = this.clock.now();
    const expiresAt = new Date(issuedAt.getTime() + 48 * 60 * 60 * 1_000);
    const token = this.tokens.generate();
    const invitation = MembershipInvitation.issue({ id: this.ids.next(), organizationId: membership.organizationId, membershipId: membership.id, invitedByActorId: Identifier.fromString(input.invitedByActorId), email: account.email, tokenHash: this.tokenHasher.hash(token), issuedAt, expiresAt });
    await this.repository.create({ account, createAccount: existing === null, invitation, membership });
    const acceptanceUrl = new URL(`/invitations/${encodeURIComponent(token)}`, this.applicationUrl).toString();
    await this.delivery.send({ email: account.email, displayName: account.displayName, organizationName: input.organizationName, acceptanceUrl, expiresAt });
    return { membership, invitation, acceptanceUrl };
  }
}
