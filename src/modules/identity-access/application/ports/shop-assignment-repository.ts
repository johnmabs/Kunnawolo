export interface ShopAssignmentRepository {
  assign(input: Readonly<{ id: string; membershipId: string; shopId: string }>): Promise<void>;
  findShopIdsForMembership(membershipId: string): Promise<readonly string[]>;
}
