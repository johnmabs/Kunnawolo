import type { OrganizationMembership } from "../../domain/organization-membership";
import type { UserAccount } from "../../domain/user-account";
export interface IdentityRepository {
  saveAccount(account: UserAccount): Promise<void>;
  saveMembership(membership: OrganizationMembership): Promise<void>;
}
