import type { SaleCancellation } from "../../domain/sale-cancellation";
export interface SaleCancellationRepository { findByReference(organizationId: string, reference: string): Promise<SaleCancellation | null>; commit(cancellation: SaleCancellation): Promise<void>; }
