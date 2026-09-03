import { describe, expect, it } from "vitest";
import { AuthorizationPolicy } from "./authorization-policy";

describe("AuthorizationPolicy", () => {
  const policy = new AuthorizationPolicy();
  it("allows an owner across its organization and limits a manager to assigned shops", () => {
    expect(() =>
      policy.authorize({
        membershipStatus: "ACTIVE",
        role: "OWNER",
        membershipOrganizationId: "org",
        targetOrganizationId: "org",
        targetShopId: null,
        assignedShopIds: [],
      }),
    ).not.toThrow();
    expect(() =>
      policy.authorize({
        membershipStatus: "ACTIVE",
        role: "MANAGER",
        membershipOrganizationId: "org",
        targetOrganizationId: "org",
        targetShopId: "other",
        assignedShopIds: ["shop"],
      }),
    ).toThrow("Membership is not assigned");
  });
});
