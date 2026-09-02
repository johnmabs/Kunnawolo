import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { TransferScope } from "../application/ports/transfer-scope";

export class PrismaTransferScope implements TransferScope {
  public constructor(private readonly prisma: PrismaClient) {}

  public async activeShopBelongsToOrganization(organizationId: string, shopId: string): Promise<boolean> {
    return await this.prisma.shop.count({ where: { id: shopId, organizationId, isActive: true } }) === 1;
  }

  public async activeTrackedProductBelongsToOrganization(organizationId: string, productId: string): Promise<boolean> {
    return await this.prisma.product.count({ where: { id: productId, organizationId, isActive: true, trackInventory: true } }) === 1;
  }
}
