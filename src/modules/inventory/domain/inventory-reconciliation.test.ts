import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { InventoryReconciliation } from "./inventory-reconciliation";

const id = (value: string) => Identifier.fromString(value);
describe("InventoryReconciliation", () => {
  it("keeps only divergences and normalizes the Unicode reference", () => {
    const reconciliation = InventoryReconciliation.detect({
      id: id("reconciliation"),
      organizationId: id("org"),
      shopId: id("shop"),
      reference: "  RAPP-ɔ  ",
      actorId: "actor",
      reconciledAt: new Date(),
      snapshots: [
        {
          productId: id("product-a"),
          stockLevelId: id("level-a"),
          stockLevelQuantity: 8,
          ledgerQuantity: 5,
        },
        {
          productId: id("product-b"),
          stockLevelId: id("level-b"),
          stockLevelQuantity: 2,
          ledgerQuantity: 2,
        },
      ],
      lineIds: [id("line-a")],
    });
    expect(reconciliation).toMatchObject({
      reference: "RAPP-ɔ",
      lines: [
        { quantityDifference: 3, stockLevelQuantity: 8, ledgerQuantity: 5 },
      ],
    });
  });
  it("rejects an empty reference", () => {
    expect(() =>
      InventoryReconciliation.detect({
        id: id("reconciliation"),
        organizationId: id("org"),
        shopId: id("shop"),
        reference: " ",
        actorId: null,
        reconciledAt: new Date(),
        snapshots: [],
        lineIds: [],
      }),
    ).toThrow(
      expect.objectContaining({
        code: "inventory.invalid_reconciliation_reference",
      }),
    );
  });
});
