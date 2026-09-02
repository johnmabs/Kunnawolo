import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import { StockTransferCancellation } from "../domain/stock-transfer";
import type { StockTransferRepository } from "./ports/stock-transfer-repository";
import type { TransfersDispatchAuthorization } from "./ports/transfers-dispatch-authorization";

export class CancelStockTransfer {
  public constructor(private readonly transfers: StockTransferRepository, private readonly authorization: TransfersDispatchAuthorization, private readonly clock: Clock) {}
  public async execute(input: Readonly<{ organizationId: string; transferId: string; reference: string; reason: string; actorId: string | null }>): Promise<StockTransferCancellation> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.transfers.findCancellationByReference(input.organizationId, reference);
    if (existing !== null) {
      if (existing.transferId.value !== input.transferId) throw new DomainError("transfers.cancellation_reference_taken", "The cancellation reference is already used.");
      return existing;
    }
    const transfer = await this.transfers.findDraft(input.organizationId, input.transferId);
    if (transfer === null) throw new DomainError("transfers.draft_not_found", "Only a draft transfer can be cancelled.");
    await this.authorization.authorize(input.organizationId, transfer.sourceShopId.value, input.actorId);
    return this.transfers.cancel(StockTransferCancellation.create(transfer, reference, input.reason, input.actorId, this.clock.now()));
  }
}
