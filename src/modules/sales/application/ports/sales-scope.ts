export type ProductSaleSnapshot = Readonly<{
  name: string;
  unitPriceMinor: number;
  unitCostMinor: number;
  currency: string;
}>;
export interface SalesScope {
  activeShopBelongsToOrganization(
    organizationId: string,
    shopId: string,
  ): Promise<boolean>;
  findActiveProductSnapshot(
    organizationId: string,
    productId: string,
  ): Promise<ProductSaleSnapshot | null>;
}
