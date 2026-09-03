import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import { Identifier } from "@/shared/domain/identifier";
import type { ShopRepository } from "../application/ports/shop-repository";
import { Shop } from "../domain/shop";

export class PrismaShopRepository implements ShopRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async save(shop: Shop): Promise<void> {
    await this.prisma.shop.upsert({
      where: { id: shop.id.value },
      create: {
        id: shop.id.value,
        organizationId: shop.organizationId.value,
        code: shop.code,
        name: shop.name,
        isActive: shop.isActive,
      },
      update: { code: shop.code, name: shop.name, isActive: shop.isActive },
    });
  }
  public async findById(id: string): Promise<Shop | null> {
    const row = await this.prisma.shop.findUnique({ where: { id } });
    if (row === null) return null;
    const shop = Shop.create(
      Identifier.fromString(row.id),
      Identifier.fromString(row.organizationId),
      row.code,
      row.name,
    );
    return row.isActive ? shop : shop.deactivate();
  }
}
