import type { IdentifierGenerator } from "./ports/identifier-generator";
import type { OrganizationOnboardingRepository } from "./ports/organization-onboarding-repository";
import { Organization, type OrganizationProfile } from "../domain/organization";
import { Shop } from "../domain/shop";

export class CreateOwnedOrganization {
  public constructor(
    private readonly repository: OrganizationOnboardingRepository,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  public async execute(
    input: OrganizationProfile &
      Readonly<{
        ownerUserAccountId: string;
        shopCode: string;
        shopName: string;
      }>,
  ) {
    const organization = Organization.create(this.identifiers.next(), input);
    const initialShop = Shop.create(
      this.identifiers.next(),
      organization.id,
      input.shopCode,
      input.shopName,
    );
    await this.repository.createWithOwner({
      organization,
      initialShop,
      membershipId: this.identifiers.next().value,
      ownerUserAccountId: input.ownerUserAccountId,
    });
    return { organization, initialShop };
  }
}
