import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import { InventorySession, InventorySessionLine } from "./inventory-session";
import { InventoryAdjustment } from "./inventory-adjustment";

const id = (value: string) => Identifier.fromString(value);
const session = (expected: number, counted: number) =>
  InventorySession.open(id("session"), id("org"), id("shop"), [
    InventorySessionLine.snapshot(
      id("line"),
      id("product"),
      Quantity.fromNumber(expected),
      Quantity.fromNumber(counted),
    ),
  ]);

describe("InventoryAdjustment", () => {
  it("snapshots a discrepancy and preserves a normalized Unicode reference", () => {
    const adjustment = InventoryAdjustment.fromClosedSession({
      id: id("adjustment"),
      session: session(8, 6),
      reference: "  INV-Ɛ  ",
      actorId: "actor",
      adjustedAt: new Date(),
      lineIds: [id("adjustment-line")],
      movementIds: [id("movement")],
    });
    expect(adjustment).toMatchObject({
      reference: "INV-Ɛ",
      lines: [
        {
          quantityDelta: -2,
          expectedQuantity: { value: 8 },
          countedQuantity: { value: 6 },
        },
      ],
    });
  });

  it("rejects a session without discrepancy", () => {
    expect(() =>
      InventoryAdjustment.fromClosedSession({
        id: id("adjustment"),
        session: session(8, 8),
        reference: "INV-1",
        actorId: null,
        adjustedAt: new Date(),
        lineIds: [],
        movementIds: [],
      }),
    ).toThrow(
      expect.objectContaining({ code: "inventory.no_adjustment_required" }),
    );
  });
});
