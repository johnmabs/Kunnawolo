import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ProcessInvitationDelivery } from "@/modules/identity-access/application/process-invitation-delivery";
import { PrismaInvitationDeliveryOutbox } from "@/modules/identity-access/infrastructure/prisma-invitation-delivery-outbox";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { configuredInvitationDelivery } from "../../_shared/configured-invitation-delivery";

export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const expected = process.env.INVITATION_DELIVERY_CRON_SECRET?.trim();
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ code: "security.invalid_cron_secret" }, { status: 401 });
  const databaseUrl = process.env.DATABASE_URL;
  const configured = configuredInvitationDelivery();
  if (!databaseUrl || configured === null) return NextResponse.json({ code: "iam.invitation_delivery_unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const processor = new ProcessInvitationDelivery(new PrismaInvitationDeliveryOutbox(prisma), configured.delivery, new SystemClock());
    const totals = { sent: 0, failed: 0 };
    for (let count = 0; count < 25; count += 1) {
      const result = await processor.execute();
      if (result === "IDLE") break;
      if (result === "SENT") totals.sent += 1;
      if (result === "FAILED") totals.failed += 1;
    }
    return NextResponse.json(totals);
  } finally {
    await prisma.$disconnect();
  }
}
