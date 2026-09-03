"use server";

import { revalidatePath } from "next/cache";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { CreateShop } from "@/modules/organization/application/create-shop";
import { PrismaAuditLog } from "@/modules/organization/infrastructure/prisma-audit-log";
import { PrismaShopRepository } from "@/modules/organization/infrastructure/prisma-shop-repository";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";

export type CreateShopState = Readonly<{ error: string | null; created: boolean; revision: number }>;

export async function createShopAction(previous: CreateShopState, formData: FormData): Promise<CreateShopState> {
  const databaseUrl = process.env.DATABASE_URL; const organizationId = formData.get("organizationId"); const name = formData.get("name"); const code = formData.get("code");
  if (!databaseUrl || typeof organizationId !== "string" || typeof name !== "string" || typeof code !== "string") return { error: "Vérifiez les informations du formulaire.", created: false, revision: previous.revision + 1 };
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const membership = await prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId, userAccountId: account.id.value } } });
    if (membership?.status !== "ACTIVE" || membership.role !== "OWNER") return { error: "Vous n’êtes pas autorisé à créer une boutique.", created: false, revision: previous.revision + 1 };
    await new CreateShop(new PrismaShopRepository(prisma), new PrismaAuditLog(prisma), new UuidIdentifierGenerator()).execute({ organizationId, name, code, actorId: account.id.value });
    revalidatePath("/administration/shops");
    return { error: null, created: true, revision: previous.revision + 1 };
  } catch (error) {
    const codeValue = error instanceof Error && "code" in error ? String(error.code) : "shop.creation_failed";
    return { error: codeValue, created: false, revision: previous.revision + 1 };
  } finally { await prisma.$disconnect(); }
}
