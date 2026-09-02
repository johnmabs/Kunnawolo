import type { StockTransfer, StockTransferLine } from "../../domain/stock-transfer";

export type TransferAudit = Readonly<{ organizationId: string; actorId: string | null; action: string }>;

export interface StockTransferRepository {
  create(transfer: StockTransfer, audit: TransferAudit): Promise<void>;
  findDraft(organizationId: string, transferId: string): Promise<StockTransfer | null>;
  saveLine(organizationId: string, transferId: string, line: StockTransferLine, audit: TransferAudit): Promise<void>;
}
