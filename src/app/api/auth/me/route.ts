import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { apiErrorResponse } from "../../_shared/api-error";
import { authenticateWebRequest } from "../_shared/web-session-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "auth.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const [memberships, preferences] = await Promise.all([
      prisma.organizationMembership.findMany({ where: { userAccountId: account.id.value, status: "ACTIVE" }, include: { organization: { include: { shops: true } }, shopAssignments: { include: { shop: true } } }, orderBy: { organization: { name: "asc" } } }),
      prisma.workspacePreference.findMany({ where: { actorId: account.id.value } }),
    ]);
    return NextResponse.json({
      account: { id: account.id.value, email: account.email, displayName: account.displayName },
      organizations: memberships.map((membership) => ({
        id: membership.organization.id,
        name: membership.organization.name,
        currency: membership.organization.currency,
        role: membership.role,
        preference: (() => { const preference = preferences.find(({ organizationId }) => organizationId === membership.organizationId); return preference ? { shopId: preference.shopId, isCompact: preference.isCompact } : null; })(),
        shops: (membership.role === "OWNER" ? membership.organization.shops : membership.shopAssignments.map(({ shop }) => shop)).filter(({ isActive }) => isActive).sort((left, right) => left.name.localeCompare(right.name, "fr")).map((shop) => ({ id: shop.id, name: shop.name, code: shop.code })),
      })),
    });
  } catch (error) { return apiErrorResponse(error, "auth.session_read_failed"); }
  finally { await prisma.$disconnect(); }
}
