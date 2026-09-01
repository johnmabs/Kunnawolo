import { OrganizationMembership } from "../domain/organization-membership";
import { UserAccount } from "../domain/user-account";
import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import type { IdentityRepository } from "./ports/identity-repository";
import type { AuditLog } from "@/modules/organization/application/ports/audit-log";
import { Identifier } from "@/shared/domain/identifier";

export class InviteMember {
  public constructor(private readonly repository: IdentityRepository, private readonly audit: AuditLog, private readonly ids: IdentifierGenerator) {}
  public async execute(input: Readonly<{ organizationId: string; email: string; displayName: string }>): Promise<OrganizationMembership> {
    const account = UserAccount.create(this.ids.next(), input.email, input.displayName);
    const membership = OrganizationMembership.invite(this.ids.next(), Identifier.fromString(input.organizationId), account.id);
    await this.repository.saveAccount(account);
    await this.repository.saveMembership(membership);
    await this.audit.record({ organizationId: input.organizationId, actorId: null, action: "membership.invited" });
    return membership;
  }
}
