import type { Organization } from "../../domain/organization";
import type { Shop } from "../../domain/shop";

export interface OrganizationOnboardingRepository {
  createWithOwner(
    input: Readonly<{
      organization: Organization;
      initialShop: Shop;
      membershipId: string;
      ownerUserAccountId: string;
    }>,
  ): Promise<void>;
}
