import { describe, expect, it } from "vitest";
import type { InventoryProjectionRepository } from "./ports/inventory-projection-repository";
import { ListStock } from "./list-stock";

describe("ListStock", () => {
  it("normalizes Unicode product search and rejects a shop outside the organization", async () => {
    let receivedSearch: string | null = null;
    const projections = {
      listStock: async (
        _organizationId: string,
        _shopId: string,
        search: string | null,
      ) => {
        receivedSearch = search;
        return null;
      },
    } as InventoryProjectionRepository;
    const list = new ListStock(projections);
    await expect(
      list.execute({
        organizationId: "org",
        shopId: "foreign-shop",
        productSearch: "  Cafe\u0301 Ɛ  ",
      }),
    ).rejects.toMatchObject({ code: "inventory.shop_not_found" });
    expect(receivedSearch).toBe("Café Ɛ");
  });
});
