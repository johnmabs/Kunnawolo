import type { StockTransfer, StockTransferCancellation, StockTransferLine, StockTransferReception, StockTransferShipment } from "../../domain/stock-transfer";

export type TransferAudit = Readonly<{ organizationId: string; actorId: string | null; action: string }>;

export interface StockTransferRepository {
  create(transfer: StockTransfer, audit: TransferAudit): Promise<void>;
  findDraft(organizationId: string, transferId: string): Promise<StockTransfer | null>;
  saveLine(organizationId: string, transferId: string, line: StockTransferLine, audit: TransferAudit): Promise<void>;
  findShipmentByReference(organizationId: string, reference: string): Promise<StockTransferShipment | null>;
  findShipment(organizationId: string, transferId: string): Promise<StockTransferShipment | null>;
  dispatch(shipment: StockTransferShipment): Promise<StockTransferShipment>;
  findReceptionByReference(organizationId: string, reference: string): Promise<StockTransferReception | null>;
  receive(reception: StockTransferReception): Promise<StockTransferReception>;
  findCancellationByReference(organizationId: string, reference: string): Promise<StockTransferCancellation | null>;
  cancel(cancellation: StockTransferCancellation): Promise<StockTransferCancellation>;
}
