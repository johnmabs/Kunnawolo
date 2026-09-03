import { DomainError } from "@/shared/domain/domain-error";
import type { Clock } from "@/shared/domain/clock";
import type { OpaqueTokenHasher } from "./ports/opaque-token";
import type { MembershipInvitationRepository } from "./ports/membership-invitation-repository";

export class GetMembershipInvitation {
  public constructor(
    private readonly repository: MembershipInvitationRepository,
    private readonly tokenHasher: OpaqueTokenHasher,
    private readonly clock: Clock,
  ) {}
  public async execute(token: string) {
    const details =
      token.length === 0
        ? null
        : await this.repository.findByTokenHash(this.tokenHasher.hash(token));
    if (
      details === null ||
      details.invitation.acceptedAt !== null ||
      details.invitation.expiresAt <= this.clock.now()
    )
      throw new DomainError(
        "auth.invitation_invalid",
        "The invitation is invalid or expired.",
      );
    return details;
  }
}
