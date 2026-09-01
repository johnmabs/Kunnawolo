import type { Shop } from "../../domain/shop";

export interface ShopRepository {
  save(shop: Shop): Promise<void>;
  findById(id: string): Promise<Shop | null>;
}
