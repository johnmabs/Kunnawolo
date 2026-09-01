import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";

export type MembershipStatus = "INVITED" | "ACTIVE" | "INACTIVE";
export class OrganizationMembership {
  private constructor(public readonly id: Identifier, public readonly organizationId: Identifier, public readonly userAccountId: Identifier, public readonly status: MembershipStatus) {}
  public static invite(id: Identifier, organizationId: Identifier, userAccountId: Identifier): OrganizationMembership { return new OrganizationMembership(id, organizationId, userAccountId, "INVITED"); }
  public activate(): OrganizationMembership { if (this.status !== "INVITED") throw new DomainError("iam.invalid_membership_transition", "Only an invitation can be activated."); return new OrganizationMembership(this.id, this.organizationId, this.userAccountId, "ACTIVE"); }
  public deactivate(): OrganizationMembership { if (this.status === "INACTIVE") throw new DomainError("iam.invalid_membership_transition", "Membership is already inactive."); return new OrganizationMembership(this.id, this.organizationId, this.userAccountId, "INACTIVE"); }
}
