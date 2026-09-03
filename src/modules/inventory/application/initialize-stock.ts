import { ReceiveStock } from "./receive-stock";
export class InitializeStock {
  public constructor(private readonly receive: ReceiveStock) {}
  public async execute(
    input: Readonly<{
      organizationId: string;
      shopId: string;
      productId: string;
      quantity: number;
      reference: string;
      actorId: string | null;
      idempotencyKey: string;
    }>,
  ) {
    return this.receive.execute({
      ...input,
      reference: `initialization:${input.reference}`,
    });
  }
}
