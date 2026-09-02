import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import { StockTransferShipment } from "../domain/stock-transfer";
import type { StockTransferRepository } from "./ports/stock-transfer-repository";
import type { TransfersDispatchAuthorization } from "./ports/transfers-dispatch-authorization";

export class SendStockTransfer {
  public constructor(
    private readonly transfers: StockTransferRepository,
    private readonly authorization: TransfersDispatchAuthorization,
    private readonly clock: Clock,
  ) {}

  public async execute(input: Readonly<{ organizationId: string; transferId: string; reference: string; actorId: string | null }>): Promise<StockTransferShipment> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.transfers.findShipmentByReference(input.organizationId, reference);
    if (existing !== null) {
      if (existing.transferId.value !== input.transferId) throw new DomainError("transfers.shipment_reference_taken", "The shipment reference is already used.");
      return existing;
    }
    const transfer = await this.transfers.findDraft(input.organizationId, input.transferId);
    if (transfer === null) throw new DomainError("transfers.draft_not_found", "The draft transfer does not belong to this organization.");
    await this.authorization.authorize(input.organizationId, transfer.sourceShopId.value, input.actorId);
    return this.transfers.dispatch(StockTransferShipment.create(transfer, reference, input.actorId, this.clock.now()));
  }
}
