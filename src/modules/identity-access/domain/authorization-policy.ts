import { DomainError } from "@/shared/domain/domain-error";

export type OrganizationRole = "OWNER" | "MANAGER" | "CASHIER";
export type AuthorizationContext = Readonly<{
  membershipStatus: "INVITED" | "ACTIVE" | "INACTIVE";
  role: OrganizationRole;
  membershipOrganizationId: string;
  targetOrganizationId: string;
  targetShopId: string | null;
  assignedShopIds: readonly string[];
}>;

export class AuthorizationPolicy {
  public authorize(context: AuthorizationContext): void {
    if (
      context.membershipStatus !== "ACTIVE" ||
      context.membershipOrganizationId !== context.targetOrganizationId
    ) {
      throw new DomainError(
        "iam.access_denied",
        "Membership is not authorized for this organization.",
      );
    }
    if (context.role === "OWNER") return;
    if (
      context.targetShopId === null ||
      !context.assignedShopIds.includes(context.targetShopId)
    ) {
      throw new DomainError(
        "iam.access_denied",
        "Membership is not assigned to this shop.",
      );
    }
  }
}
