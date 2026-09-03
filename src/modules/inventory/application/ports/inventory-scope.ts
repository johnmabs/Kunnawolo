export interface InventoryScope {
  shopBelongsToOrganization(
    organizationId: string,
    shopId: string,
  ): Promise<boolean>;
  productTracksInventory(
    organizationId: string,
    productId: string,
  ): Promise<boolean>;
}
