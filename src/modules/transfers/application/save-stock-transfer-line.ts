import type { IdentifierGenerator } from "@/modules/organization/application/ports/identifier-generator";
import { DomainError } from "@/shared/domain/domain-error";
import { Identifier } from "@/shared/domain/identifier";
import { Quantity } from "@/shared/domain/quantity";
import type { StockTransferRepository } from "./ports/stock-transfer-repository";
import type { TransferScope } from "./ports/transfer-scope";
import { StockTransferLine } from "../domain/stock-transfer";

export class SaveStockTransferLine {
  public constructor(
    private readonly scope: TransferScope,
    private readonly transfers: StockTransferRepository,
    private readonly ids: IdentifierGenerator,
  ) {}

  public async execute(
    input: Readonly<{
      organizationId: string;
      transferId: string;
      productId: string;
      quantity: number;
      actorId: string | null;
    }>,
  ): Promise<StockTransferLine> {
    const transfer = await this.transfers.findDraft(
      input.organizationId,
      input.transferId,
    );
    if (transfer === null)
      throw new DomainError(
        "transfers.draft_not_found",
        "The draft transfer does not belong to this organization.",
      );
    if (
      !(await this.scope.activeTrackedProductBelongsToOrganization(
        input.organizationId,
        input.productId,
      ))
    ) {
      throw new DomainError(
        "transfers.product_not_found",
        "The tracked product does not belong to this organization.",
      );
    }
    const existing = transfer.lines.find(
      ({ productId }) => productId.value === input.productId,
    );
    const line = StockTransferLine.create({
      id: existing?.id ?? this.ids.next(),
      productId: Identifier.fromString(input.productId),
      quantity: Quantity.fromNumber(input.quantity),
    });
    await this.transfers.saveLine(
      input.organizationId,
      input.transferId,
      line,
      {
        organizationId: input.organizationId,
        actorId: input.actorId,
        action: `transfer.line_saved:${input.transferId}`,
      },
    );
    return line;
  }
}
