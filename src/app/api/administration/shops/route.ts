import { NextResponse } from "next/server";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { CreateShop } from "@/modules/organization/application/create-shop";
import { PrismaAuditLog } from "@/modules/organization/infrastructure/prisma-audit-log";
import { PrismaShopRepository } from "@/modules/organization/infrastructure/prisma-shop-repository";
import { apiErrorResponse } from "../../_shared/api-error";
import { assertTrustedOrigin, authenticateWebRequest } from "../../auth/_shared/web-session-access";

export const dynamic = "force-dynamic";

async function access(prisma: ReturnType<typeof createPrismaClient>, organizationId: string) {
  const account = await authenticateWebRequest(prisma);
  const membership = await prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId, userAccountId: account.id.value } }, include: { shopAssignments: true } });
  return { account, membership };
}

export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get("organizationId")?.trim();
  if (!organizationId) return NextResponse.json({ code: "shop.invalid_request" }, { status: 400 });
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "shop.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    const { membership } = await access(prisma, organizationId);
    if (membership?.status !== "ACTIVE") return NextResponse.json({ code: "shop.list_forbidden" }, { status: 403 });
    const permittedIds = membership.role === "OWNER" ? undefined : membership.shopAssignments.map(({ shopId }) => shopId);
    const shops = await prisma.shop.findMany({ where: { organizationId, ...(permittedIds ? { id: { in: permittedIds } } : {}) }, orderBy: { name: "asc" } });
    return NextResponse.json({ items: shops.map((shop) => ({ id: shop.id, name: shop.name, code: shop.code, isActive: shop.isActive })) });
  } catch (error) { return apiErrorResponse(error, "shop.list_failed"); }
  finally { await prisma.$disconnect(); }
}

export async function POST(request: Request) {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return NextResponse.json({ code: "shop.unavailable" }, { status: 503 });
  const prisma = createPrismaClient(databaseUrl);
  try {
    assertTrustedOrigin(request);
    const input = await request.json() as { organizationId?: unknown; name?: unknown; code?: unknown };
    if (typeof input.organizationId !== "string" || typeof input.name !== "string" || typeof input.code !== "string") return NextResponse.json({ code: "shop.invalid_request" }, { status: 400 });
    const { account, membership } = await access(prisma, input.organizationId);
    if (membership?.status !== "ACTIVE" || membership.role !== "OWNER") return NextResponse.json({ code: "shop.creation_forbidden" }, { status: 403 });
    const shop = await new CreateShop(new PrismaShopRepository(prisma), new PrismaAuditLog(prisma), new UuidIdentifierGenerator()).execute({ organizationId: input.organizationId, name: input.name, code: input.code, actorId: account.id.value });
    return NextResponse.json({ id: shop.id.value, name: shop.name, code: shop.code, isActive: shop.isActive }, { status: 201 });
  } catch (error) { return apiErrorResponse(error, "shop.creation_failed"); }
  finally { await prisma.$disconnect(); }
}
