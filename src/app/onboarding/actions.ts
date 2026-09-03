"use server";

import { redirect, RedirectType } from "next/navigation";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { CreateOwnedOrganization } from "@/modules/organization/application/create-owned-organization";
import { PrismaOrganizationOnboardingRepository } from "@/modules/organization/infrastructure/prisma-organization-onboarding-repository";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";

export type OrganizationOnboardingState = Readonly<{ error: string | null }>;

export async function createOrganizationAction(_previous: OrganizationOnboardingState, formData: FormData): Promise<OrganizationOnboardingState> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return { error: "Le service est momentanément indisponible." };
  const name = formData.get("name"); const currency = formData.get("currency"); const shopName = formData.get("shopName"); const shopCode = formData.get("shopCode");
  if (typeof name !== "string" || typeof currency !== "string" || typeof shopName !== "string" || typeof shopCode !== "string") return { error: "Vérifiez les informations du formulaire." };
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    await new CreateOwnedOrganization(new PrismaOrganizationOnboardingRepository(prisma), new UuidIdentifierGenerator()).execute({ name, currency, ownerUserAccountId: account.id.value, shopName, shopCode });
  } catch {
    return { error: "La création de l’organisation est momentanément impossible. Vérifiez les informations et réessayez." };
  } finally {
    await prisma.$disconnect();
  }
  redirect("/", RedirectType.replace);
}
