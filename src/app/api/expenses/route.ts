import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListExpenses } from "@/modules/expenses/application/list-expenses";
import { PrismaExpenseConsultationRepository } from "@/modules/expenses/infrastructure/prisma-expense-consultation-repository";
import { PrismaExpenseReadAuthorization } from "@/modules/expenses/infrastructure/prisma-expense-read-authorization";
import { authenticateApiRequest } from "../_shared/api-access";
import { apiErrorResponse } from "../_shared/api-error";

export const dynamic = "force-dynamic";

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value) return null;
  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`,
  );
  return Number.isNaN(date.valueOf()) ? null : date;
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams;
  const organizationId = search.get("organizationId")?.trim();
  const shopId = search.get("shopId")?.trim();
  if (!organizationId)
    return NextResponse.json(
      { code: "expenses.invalid_list_request" },
      { status: 400 },
    );
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined)
    return NextResponse.json({ code: "expenses.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const access = await authenticateApiRequest(
      prisma,
      request.headers.get("authorization"),
      organizationId,
    );
    const items = await new ListExpenses(
      new PrismaExpenseConsultationRepository(prisma),
      new PrismaExpenseReadAuthorization(prisma),
    ).execute({
      organizationId,
      actorId: access.actorId,
      shopId: shopId || null,
      query: search.get("query"),
      occurredFrom: parseDate(search.get("from")),
      occurredTo: parseDate(search.get("to"), true),
      status: search.get("status"),
    });
    return NextResponse.json({
      items: items.map(({ expense, categoryName, cancellation }) => ({
        id: expense.id.value,
        shopId: expense.shopId?.value ?? null,
        categoryId: expense.categoryId.value,
        categoryName,
        amountMinor: expense.amount.amountMinor,
        currency: expense.amount.currency,
        reference: expense.reference,
        description: expense.description,
        occurredAt: expense.occurredAt,
        cancellation:
          cancellation === null
            ? null
            : {
                reference: cancellation.reference,
                reason: cancellation.reason,
                cancelledAt: cancellation.cancelledAt,
              },
      })),
    });
  } catch (error) {
    return apiErrorResponse(error, "expenses.list_failed");
  } finally {
    await prisma.$disconnect();
  }
}
