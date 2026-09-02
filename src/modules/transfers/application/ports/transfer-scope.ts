export interface TransferScope {
  activeShopBelongsToOrganization(organizationId: string, shopId: string): Promise<boolean>;
  activeTrackedProductBelongsToOrganization(organizationId: string, productId: string): Promise<boolean>;
}
