import { describe, expect, it } from "vitest";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import { StockTransfer, StockTransferCancellation, StockTransferLine, StockTransferShipment } from "./stock-transfer";

describe("StockTransfer", () => {
  it("rejects identical shops and non-positive lines", () => {
    expect(() => StockTransfer.draft({ id: Identifier.fromString("transfer"), organizationId: Identifier.fromString("org"), sourceShopId: Identifier.fromString("shop"), destinationShopId: Identifier.fromString("shop") })).toThrowError(expect.objectContaining({ code: "transfers.same_source_and_destination" }));
    expect(() => StockTransferLine.create({ id: Identifier.fromString("line"), productId: Identifier.fromString("product"), quantity: Quantity.zero() })).toThrowError(expect.objectContaining({ code: "transfers.invalid_line_quantity" }));
  });

  it("keeps one valid line per product", () => {
    const transfer = StockTransfer.draft({ id: Identifier.fromString("transfer"), organizationId: Identifier.fromString("org"), sourceShopId: Identifier.fromString("source"), destinationShopId: Identifier.fromString("destination") });
    const product = Identifier.fromString("product");
    expect(transfer.addOrReplace(StockTransferLine.create({ id: Identifier.fromString("line"), productId: product, quantity: Quantity.fromNumber(2) }))).toMatchObject({ lines: [{ quantity: { value: 2 } }] });
  });

  it("requires a line and normalizes a shipment reference", () => {
    const empty = StockTransfer.draft({ id: Identifier.fromString("empty"), organizationId: Identifier.fromString("org"), sourceShopId: Identifier.fromString("source"), destinationShopId: Identifier.fromString("destination") });
    expect(() => StockTransferShipment.create(empty, "EXP", "actor", new Date())).toThrowError(expect.objectContaining({ code: "transfers.empty_transfer" }));
    const transfer = empty.addOrReplace(StockTransferLine.create({ id: Identifier.fromString("line"), productId: Identifier.fromString("product"), quantity: Quantity.fromNumber(1) }));
    expect(StockTransferShipment.create(transfer, "  EXP-Ɛ  ", "actor", new Date())).toMatchObject({ reference: "EXP-Ɛ" });
  });

  it("requires a Unicode cancellation reason", () => {
    const transfer = StockTransfer.draft({ id: Identifier.fromString("cancel"), organizationId: Identifier.fromString("org"), sourceShopId: Identifier.fromString("source"), destinationShopId: Identifier.fromString("destination") });
    expect(() => StockTransferCancellation.create(transfer, "ANN", " ", "actor", new Date())).toThrowError(expect.objectContaining({ code: "transfers.invalid_cancellation_reason" }));
    expect(StockTransferCancellation.create(transfer, "  ANN-Ɛ  ", " Écart ɲa ", "actor", new Date())).toMatchObject({ reference: "ANN-Ɛ", reason: "Écart ɲa" });
  });
});
