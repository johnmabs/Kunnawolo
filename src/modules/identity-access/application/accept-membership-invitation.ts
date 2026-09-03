import { DomainError } from "@/shared/domain/domain-error";
import type { Clock } from "@/shared/domain/clock";
import type { PasswordHasher } from "./ports/password-hasher";
import type { OpaqueTokenHasher } from "./ports/opaque-token";
import type { MembershipInvitationRepository } from "./ports/membership-invitation-repository";
import { GetMembershipInvitation } from "./get-membership-invitation";

export class AcceptMembershipInvitation {
  public constructor(private readonly repository: MembershipInvitationRepository, private readonly tokenHasher: OpaqueTokenHasher, private readonly passwords: PasswordHasher, private readonly clock: Clock) {}
  public async execute(input: Readonly<{ token: string; password: string | null; authenticatedUserAccountId: string | null }>) {
    const details = await new GetMembershipInvitation(this.repository, this.tokenHasher, this.clock).execute(input.token);
    let credential = null;
    if (details.hasCredential) {
      if (input.authenticatedUserAccountId !== details.account.id.value) throw new DomainError("auth.invitation_login_required", "Sign in with the invited account before accepting.");
    } else {
      if (input.password === null) throw new DomainError("auth.invitation_password_required", "A password is required to activate this account.");
      credential = await this.passwords.create(input.password);
    }
    const acceptedAt = this.clock.now();
    const invitation = details.invitation.accept(acceptedAt);
    const membership = details.membership.activate();
    await this.repository.accept({ invitation, membership, credential });
    return { account: details.account, organizationId: membership.organizationId.value, shouldIssueSession: !details.hasCredential };
  }
}
