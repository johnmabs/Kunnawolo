import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { OrganizationMembership } from "./organization-membership";

describe("OrganizationMembership", () => {
  it("activates an invitation and prevents a repeated activation", () => {
    const membership = OrganizationMembership.invite(Identifier.fromString("m-1"), Identifier.fromString("o-1"), Identifier.fromString("u-1"));
    expect(membership.activate().status).toBe("ACTIVE");
    expect(() => membership.activate().activate()).toThrow("Only an invitation can be activated.");
  });
});
