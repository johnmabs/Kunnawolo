import { describe, expect, it } from "vitest";
import { AuthorizationPolicy } from "../domain/authorization-policy";
import { AuthorizeAction } from "./authorize-action";

describe("AuthorizeAction", () => {
  it("rejects an inactive membership", () => {
    const authorize = new AuthorizeAction(new AuthorizationPolicy());
    expect(() => authorize.execute({ membershipStatus: "INACTIVE", role: "CASHIER", membershipOrganizationId: "org", targetOrganizationId: "org", targetShopId: "shop", assignedShopIds: ["shop"] })).toThrow("Membership is not authorized");
  });
});
