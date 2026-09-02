import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { CancelExpense } from "@/modules/expenses/application/cancel-expense";
import { PrismaExpenseCancellationRepository } from "@/modules/expenses/infrastructure/prisma-expense-cancellation-repository";
import { PrismaExpenseReadAuthorization } from "@/modules/expenses/infrastructure/prisma-expense-read-authorization";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { authenticateApiRequest } from "../../../_shared/api-access";
import { apiErrorResponse } from "../../../_shared/api-error";

type CancellationRequest = Readonly<{ organizationId?: string; reference?: string; reason?: string }>;

export async function POST(request: Request, context: Readonly<{ params: Promise<{ expenseId: string }> }>) {
  const input = await request.json() as CancellationRequest;
  const organizationId = input.organizationId?.trim(); const reference = input.reference?.trim(); const reason = input.reason?.trim();
  if (!organizationId || !reference || !reason) return NextResponse.json({ code: "expenses.invalid_cancellation_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "expenses.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(prisma, request.headers.get("authorization"), organizationId);
    const { expenseId } = await context.params;
    const expense = await prisma.expense.findFirst({ where: { id: expenseId, organizationId }, select: { shopId: true } });
    if (expense === null) return NextResponse.json({ code: "expenses.expense_not_found" }, { status: 404 });
    await new PrismaExpenseReadAuthorization(prisma).authorize(organizationId, expense.shopId, access.actorId);
    const cancellation = await new CancelExpense(new PrismaExpenseCancellationRepository(prisma), new UuidIdentifierGenerator(), new SystemClock()).execute({ organizationId, expenseId, reference, reason, actorId: access.actorId });
    return NextResponse.json({ reference: cancellation.reference, reason: cancellation.reason, cancelledAt: cancellation.cancelledAt });
  } catch (error) { return apiErrorResponse(error, "expenses.cancellation_failed"); }
  finally { await prisma.$disconnect(); }
}
