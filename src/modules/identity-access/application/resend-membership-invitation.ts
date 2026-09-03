import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { MembershipInvitation } from "../domain/membership-invitation";
import type { MembershipInvitationRepository } from "./ports/membership-invitation-repository";
import type {
  OpaqueTokenGenerator,
  OpaqueTokenHasher,
} from "./ports/opaque-token";

export class ResendMembershipInvitation {
  public constructor(
    private readonly repository: MembershipInvitationRepository,
    private readonly ids: IdentifierGenerator,
    private readonly tokens: OpaqueTokenGenerator,
    private readonly tokenHasher: OpaqueTokenHasher,
    private readonly clock: Clock,
    private readonly applicationUrl: string,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      invitationId: string;
      actorId: string;
    }>,
  ) {
    await this.repository.authorizeInvitation(
      input.organizationId,
      input.actorId,
    );
    const details = await this.repository.findPendingById(
      input.organizationId,
      input.invitationId,
    );
    if (details === null)
      throw new DomainError(
        "iam.invitation_not_pending",
        "Only a pending membership invitation can be sent again.",
      );
    const issuedAt = this.clock.now();
    const expiresAt = new Date(issuedAt.getTime() + 48 * 60 * 60 * 1_000);
    const token = this.tokens.generate();
    const invitation = MembershipInvitation.issue({
      id: details.invitation.id,
      organizationId: details.invitation.organizationId,
      membershipId: details.invitation.membershipId,
      invitedByActorId: Identifier.fromString(input.actorId),
      email: details.invitation.email,
      tokenHash: this.tokenHasher.hash(token),
      issuedAt,
      expiresAt,
    });
    const acceptanceUrl = new URL(
      `/invitations/${encodeURIComponent(token)}`,
      this.applicationUrl,
    ).toString();
    const deliveryId = this.ids.next().value;
    await this.repository.reissue({
      invitation,
      delivery: {
        id: deliveryId,
        invitationId: invitation.id.value,
        email: details.account.email,
        displayName: details.account.displayName,
        organizationName: details.organizationName,
        acceptanceUrl,
        expiresAt,
      },
    });
    return { invitation, acceptanceUrl, deliveryId };
  }
}
