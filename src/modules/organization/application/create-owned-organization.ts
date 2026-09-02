import type { IdentifierGenerator } from "./ports/identifier-generator";
import type { OrganizationOnboardingRepository } from "./ports/organization-onboarding-repository";
import { Organization, type OrganizationProfile } from "../domain/organization";

export class CreateOwnedOrganization {
  public constructor(private readonly repository: OrganizationOnboardingRepository, private readonly identifiers: IdentifierGenerator) {}

  public async execute(input: OrganizationProfile & Readonly<{ ownerUserAccountId: string }>): Promise<Organization> {
    const organization = Organization.create(this.identifiers.next(), input);
    await this.repository.createWithOwner({
      organization,
      membershipId: this.identifiers.next().value,
      ownerUserAccountId: input.ownerUserAccountId,
    });
    return organization;
  }
}
