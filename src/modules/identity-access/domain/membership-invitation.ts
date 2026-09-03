import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export class MembershipInvitation {
  private constructor(
    public readonly id: Identifier,
    public readonly organizationId: Identifier,
    public readonly membershipId: Identifier,
    public readonly invitedByActorId: Identifier,
    public readonly email: string,
    public readonly tokenHash: string,
    public readonly expiresAt: Date,
    public readonly acceptedAt: Date | null,
  ) {}
  public static issue(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      membershipId: Identifier;
      invitedByActorId: Identifier;
      email: string;
      tokenHash: string;
      expiresAt: Date;
      issuedAt: Date;
    }>,
  ) {
    const email = input.email.trim().normalize("NFC").toLowerCase();
    if (!email.includes("@"))
      throw new DomainError(
        "auth.invalid_invitation_email",
        "An invitation email is invalid.",
      );
    if (!/^[a-f0-9]{64}$/.test(input.tokenHash))
      throw new DomainError(
        "auth.invalid_invitation_token",
        "An invitation token hash is invalid.",
      );
    if (input.expiresAt <= input.issuedAt)
      throw new DomainError(
        "auth.invalid_invitation_expiry",
        "An invitation expiry must be in the future.",
      );
    return new MembershipInvitation(
      input.id,
      input.organizationId,
      input.membershipId,
      input.invitedByActorId,
      email,
      input.tokenHash,
      input.expiresAt,
      null,
    );
  }
  public static restore(
    input: Readonly<{
      id: Identifier;
      organizationId: Identifier;
      membershipId: Identifier;
      invitedByActorId: Identifier;
      email: string;
      tokenHash: string;
      expiresAt: Date;
      acceptedAt: Date | null;
    }>,
  ) {
    return new MembershipInvitation(
      input.id,
      input.organizationId,
      input.membershipId,
      input.invitedByActorId,
      input.email,
      input.tokenHash,
      input.expiresAt,
      input.acceptedAt,
    );
  }
  public accept(at: Date) {
    if (this.acceptedAt !== null)
      throw new DomainError(
        "auth.invitation_already_accepted",
        "The invitation was already accepted.",
      );
    if (this.expiresAt <= at)
      throw new DomainError(
        "auth.invitation_expired",
        "The invitation has expired.",
      );
    return new MembershipInvitation(
      this.id,
      this.organizationId,
      this.membershipId,
      this.invitedByActorId,
      this.email,
      this.tokenHash,
      this.expiresAt,
      at,
    );
  }
}
