import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Shop } from "./shop";

describe("Shop", () => {
  it("preserves an immutable organization and Unicode name when deactivated", () => {
    const shop = Shop.create(
      Identifier.fromString("shop-1"),
      Identifier.fromString("org-1"),
      "BKO",
      "  Sɔgɔma  ",
    );
    expect(shop.deactivate()).toMatchObject({
      organizationId: Identifier.fromString("org-1"),
      name: "Sɔgɔma",
      isActive: false,
    });
  });
});
