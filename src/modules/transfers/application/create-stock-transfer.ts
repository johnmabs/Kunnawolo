import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import type { StockTransferRepository } from "./ports/stock-transfer-repository";
import type { TransferScope } from "./ports/transfer-scope";
import { StockTransfer } from "../domain/stock-transfer";

export class CreateStockTransfer {
  public constructor(
    private readonly scope: TransferScope,
    private readonly transfers: StockTransferRepository,
    private readonly ids: IdentifierGenerator,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      sourceShopId: string;
      destinationShopId: string;
      actorId: string | null;
    }>,
  ): Promise<StockTransfer> {
    if (input.sourceShopId === input.destinationShopId) {
      throw new DomainError(
        "transfers.same_source_and_destination",
        "The source and destination shops must differ.",
      );
    }
    const [sourceExists, destinationExists] = await Promise.all([
      this.scope.activeShopBelongsToOrganization(
        input.organizationId,
        input.sourceShopId,
      ),
      this.scope.activeShopBelongsToOrganization(
        input.organizationId,
        input.destinationShopId,
      ),
    ]);
    if (!sourceExists || !destinationExists) {
      throw new DomainError(
        "transfers.shop_not_found",
        "Both transfer shops must be active in this organization.",
      );
    }
    const transfer = StockTransfer.draft({
      id: this.ids.next(),
      organizationId: Identifier.fromString(input.organizationId),
      sourceShopId: Identifier.fromString(input.sourceShopId),
      destinationShopId: Identifier.fromString(input.destinationShopId),
    });
    await this.transfers.create(transfer, {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: `transfer.created:${transfer.id.value}`,
    });
    return transfer;
  }
}
