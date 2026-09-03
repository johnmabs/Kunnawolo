import type { Clock } from "@/shared/domain/clock";
import { DomainError } from "@/shared/domain/domain-error";
import { StockTransferReception } from "../domain/stock-transfer";
import type { StockTransferRepository } from "./ports/stock-transfer-repository";
import type { TransfersReceptionAuthorization } from "./ports/transfers-reception-authorization";

export class ReceiveStockTransfer {
  public constructor(
    private readonly transfers: StockTransferRepository,
    private readonly authorization: TransfersReceptionAuthorization,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      transferId: string;
      reference: string;
      actorId: string | null;
    }>,
  ): Promise<StockTransferReception> {
    const reference = input.reference.trim().normalize("NFC");
    const existing = await this.transfers.findReceptionByReference(
      input.organizationId,
      reference,
    );
    if (existing !== null) {
      if (existing.shipment.transferId.value !== input.transferId)
        throw new DomainError(
          "transfers.reception_reference_taken",
          "The reception reference is already used.",
        );
      return existing;
    }
    const shipment = await this.transfers.findShipment(
      input.organizationId,
      input.transferId,
    );
    if (shipment === null)
      throw new DomainError(
        "transfers.shipment_not_found",
        "The sent transfer does not belong to this organization.",
      );
    await this.authorization.authorize(
      input.organizationId,
      shipment.destinationShopId.value,
      input.actorId,
    );
    return this.transfers.receive(
      StockTransferReception.create(
        shipment,
        reference,
        input.actorId,
        this.clock.now(),
      ),
    );
  }
}
