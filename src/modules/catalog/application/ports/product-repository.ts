import type { Product } from "../../domain/product";

export type ProductAuditEntry = Readonly<{ organizationId: string; actorId: string | null; action: string }>;

export interface ProductRepository {
  save(product: Product, audit: ProductAuditEntry): Promise<void>;
  findById(organizationId: string, id: string): Promise<Product | null>;
  search(organizationId: string, query: string, includeInactive: boolean): Promise<Product[]>;
}
