import type { ExpenseCancellation } from "../../domain/expense-cancellation";

export interface ExpenseCancellationRepository {
  findByReference(organizationId: string, reference: string): Promise<ExpenseCancellation | null>;
  cancel(cancellation: ExpenseCancellation): Promise<ExpenseCancellation>;
}
