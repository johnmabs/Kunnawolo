import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { InventoryScope } from "../application/ports/inventory-scope";

export class PrismaInventoryScope implements InventoryScope {
  public constructor(private readonly prisma: PrismaClient) {}
  public async shopBelongsToOrganization(
    organizationId: string,
    shopId: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.shop.count({
        where: { id: shopId, organizationId },
      })) === 1
    );
  }
  public async productTracksInventory(
    organizationId: string,
    productId: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.product.count({
        where: { id: productId, organizationId, trackInventory: true },
      })) === 1
    );
  }
}
