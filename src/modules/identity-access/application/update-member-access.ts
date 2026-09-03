import { DomainError } from "@/shared/domain/domain-error";
import type { OrganizationRole } from "../domain/authorization-policy";
import type { AccessManagementRepository } from "./ports/access-management-repository";

const roles: readonly OrganizationRole[] = ["OWNER", "MANAGER", "CASHIER"];

export class UpdateMemberAccess {
  public constructor(private readonly repository: AccessManagementRepository) {}

  public async execute(input: Readonly<{ organizationId: string; actorId: string; userAccountId: string; role: string; shopIds: readonly string[] }>) {
    const actor = await this.repository.findMember(input.organizationId, input.actorId);
    if (actor?.status !== "ACTIVE" || actor.role !== "OWNER") throw new DomainError("iam.access_management_forbidden", "Only an active organization owner can manage access.");
    const target = await this.repository.findMember(input.organizationId, input.userAccountId);
    if (target === null) throw new DomainError("iam.membership_not_found", "The membership does not exist in this organization.");
    if (!roles.includes(input.role as OrganizationRole)) throw new DomainError("iam.invalid_role", "The organization role is invalid.");
    const role = input.role as OrganizationRole;
    const shopIds = role === "OWNER" ? [] : [...new Set(input.shopIds.map((id) => id.trim()).filter(Boolean))];
    const activeShopIds = new Set(await this.repository.findActiveShopIds(input.organizationId));
    if (shopIds.some((id) => !activeShopIds.has(id))) throw new DomainError("iam.invalid_shop_assignment", "Every assigned shop must be active in this organization.");
    if (target.status === "ACTIVE" && role !== "OWNER" && shopIds.length === 0) throw new DomainError("iam.shop_assignment_required", "An active manager or cashier must be assigned to at least one shop.");
    const member = { ...target, role, shopIds };
    await this.repository.updateAtomically({ actorId: input.actorId, member, previousRole: target.role });
    return member;
  }
}
