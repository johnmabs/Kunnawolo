import { Organization, type OrganizationProfile } from "../domain/organization";
import type { AuditLog } from "./ports/audit-log";
import type { IdentifierGenerator } from "./ports/identifier-generator";
import type { OrganizationRepository } from "./ports/organization-repository";

export class CreateOrganization {
  public constructor(
    private readonly organizations: OrganizationRepository,
    private readonly auditLog: AuditLog,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  public async execute(
    profile: OrganizationProfile,
    actorId: string | null = null,
  ): Promise<Organization> {
    const organization = Organization.create(this.identifiers.next(), profile);
    await this.organizations.save(organization);
    await this.auditLog.record({
      organizationId: organization.id.value,
      actorId,
      action: "organization.created",
    });
    return organization;
  }
}
