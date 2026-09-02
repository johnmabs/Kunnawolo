import type { Organization } from "../../domain/organization";

export interface OrganizationOnboardingRepository {
  createWithOwner(input: Readonly<{ organization: Organization; membershipId: string; ownerUserAccountId: string }>): Promise<void>;
}
