import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { RecordSalePayment } from "@/modules/sales/application/record-sale-payment";
import { PrismaSaleFinalizationRepository } from "@/modules/sales/infrastructure/prisma-sale-finalization-repository";
import { PrismaSalePaymentRepository } from "@/modules/sales/infrastructure/prisma-sale-payment-repository";
import { PrismaWorkspacePreferenceAuthorization } from "@/modules/identity-access/infrastructure/prisma-workspace-preference-authorization";
import { DomainError } from "@/shared/domain/domain-error";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../../../_shared/api-access";
import { apiErrorResponse } from "../../../../_shared/api-error";
import { toSalePaymentDto } from "../../../_shared/sale-dto";

type PaymentRequest = Readonly<{ organizationId?: string; paymentReference?: string; method?: string; amountMinor?: number; currency?: string }>;

export async function POST(request: Request, context: Readonly<{ params: Promise<{ cartId: string }> }>) {
  const input = await request.json() as PaymentRequest;
  const organizationId = input.organizationId?.trim();
  const paymentReference = input.paymentReference?.trim();
  const currency = input.currency?.trim();
  if (!organizationId || !paymentReference || !input.method || !currency || !Number.isSafeInteger(input.amountMinor)) return NextResponse.json({ code: "sales.invalid_payment_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "sales.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);

  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { cartId } = await context.params;
    const finalizations = new PrismaSaleFinalizationRepository(prisma);
    const finalization = await finalizations.findByCartId(organizationId, cartId);
    if (finalization === null) throw new DomainError("sales.sale_not_finalized", "The sale is not finalized in this organization.");
    await new PrismaWorkspacePreferenceAuthorization(prisma).authorize(organizationId, access.actorId, finalization.shopId.value);
    const payment = await new RecordSalePayment(finalizations, new PrismaSalePaymentRepository(prisma), new UuidIdentifierGenerator(), new SystemClock()).execute({ organizationId, cartId, paymentReference, method: input.method, amountMinor: input.amountMinor as number, currency, actorId: access.actorId });
    return NextResponse.json(toSalePaymentDto(payment), { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "sales.payment_failed");
  } finally {
    await prisma.$disconnect();
  }
}
