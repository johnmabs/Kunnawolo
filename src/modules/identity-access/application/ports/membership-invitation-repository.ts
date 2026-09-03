import type { PasswordHash } from "./password-hasher";
import type { MembershipInvitation } from "../../domain/membership-invitation";
import type { OrganizationMembership } from "../../domain/organization-membership";
import type { UserAccount } from "../../domain/user-account";

export type InvitationDetails = Readonly<{
  account: UserAccount;
  hasCredential: boolean;
  invitation: MembershipInvitation;
  membership: OrganizationMembership;
  organizationName: string;
}>;

export interface MembershipInvitationRepository {
  authorizeInvitation(organizationId: string, actorId: string): Promise<void>;
  findAccountByEmail(email: string): Promise<UserAccount | null>;
  create(input: Readonly<{ account: UserAccount; createAccount: boolean; invitation: MembershipInvitation; membership: OrganizationMembership }>): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<InvitationDetails | null>;
  accept(input: Readonly<{ invitation: MembershipInvitation; membership: OrganizationMembership; credential: PasswordHash | null }>): Promise<void>;
}
