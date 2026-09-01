import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { ShopAssignmentRepository } from "../application/ports/shop-assignment-repository";

export class PrismaShopAssignmentRepository implements ShopAssignmentRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public async assign(input: Readonly<{ id: string; membershipId: string; shopId: string }>): Promise<void> {
    await this.prisma.shopAssignment.upsert({ where: { membershipId_shopId: { membershipId: input.membershipId, shopId: input.shopId } }, create: input, update: {} });
  }
  public async findShopIdsForMembership(membershipId: string): Promise<readonly string[]> {
    return (await this.prisma.shopAssignment.findMany({ where: { membershipId }, select: { shopId: true } })).map((assignment) => assignment.shopId);
  }
}
