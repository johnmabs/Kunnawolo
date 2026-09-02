import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { CreateOwnedOrganization } from "./create-owned-organization";
import type { OrganizationOnboardingRepository } from "./ports/organization-onboarding-repository";

describe("CreateOwnedOrganization", () => {
  it("creates the organization and its owner membership as one repository operation", async () => {
    let saved: Parameters<OrganizationOnboardingRepository["createWithOwner"]>[0] | null = null;
    const repository: OrganizationOnboardingRepository = { createWithOwner: async (input) => { saved = input; } };
    const values = ["organization-id", "membership-id"];
    const organization = await new CreateOwnedOrganization(repository, { next: () => Identifier.fromString(values.shift()!) }).execute({ name: "ASTU SARL", currency: "XOF", ownerUserAccountId: "user-id" });
    expect(organization.name).toBe("ASTU SARL");
    expect(saved).toMatchObject({ membershipId: "membership-id", ownerUserAccountId: "user-id" });
  });
});
