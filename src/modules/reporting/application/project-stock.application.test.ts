import { describe, expect, it } from "vitest";
import type { InventoryReportingSource } from "@/modules/inventory/application/ports/inventory-reporting-source";
import type { TransfersReportingSource } from "@/modules/transfers/application/ports/transfers-reporting-source";
import { ProjectStock } from "./project-stock";

class InventorySource implements InventoryReportingSource { public async projectStock() { return { onHandQuantity: 10, lossQuantity: 2, anomalyCount: 1 }; } }
class TransfersSource implements TransfersReportingSource { public async inTransitQuantity() { return 3; } }

describe("ProjectStock", () => {
  it("combines explicit inventory and transfer sources without owning source facts", async () => {
    await expect(new ProjectStock(new InventorySource(), new TransfersSource()).execute({ organizationId: "org", shopId: "inactive-shop" })).resolves.toMatchObject({ shopId: { value: "inactive-shop" }, onHandQuantity: { value: 10 }, inTransitQuantity: { value: 3 }, lossQuantity: { value: 2 }, anomalyCount: 1 });
  });
});
