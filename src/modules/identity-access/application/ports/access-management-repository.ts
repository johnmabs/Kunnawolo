import type { MembershipStatus } from "../../domain/organization-membership";
import type { OrganizationRole } from "../../domain/authorization-policy";

export type AccessMember = Readonly<{
  id: string;
  organizationId: string;
  userAccountId: string;
  status: MembershipStatus;
  role: OrganizationRole;
  shopIds: readonly string[];
}>;

export interface AccessManagementRepository {
  findMember(organizationId: string, userAccountId: string): Promise<AccessMember | null>;
  findActiveShopIds(organizationId: string): Promise<readonly string[]>;
  updateAtomically(input: Readonly<{ actorId: string; member: AccessMember; previousRole: OrganizationRole }>): Promise<void>;
}
