"use server";

import { redirect, RedirectType } from "next/navigation";
import { cookies } from "next/headers";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { LogoutWebSession } from "@/modules/identity-access/application/logout-web-session";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { clearSessionCookie, readSessionToken } from "@/app/api/auth/_shared/session-cookie";
import { authenticateWebRequest } from "@/app/api/auth/_shared/web-session-access";

export async function selectOrganizationAction(organizationId: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;
  const prisma = createPrismaClient(databaseUrl);
  try {
    const account = await authenticateWebRequest(prisma);
    const membership = await prisma.organizationMembership.findUnique({ where: { organizationId_userAccountId: { organizationId, userAccountId: account.id.value } } });
    if (membership?.status !== "ACTIVE") return;
    (await cookies()).set("astu_organization", organizationId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 24 * 60 * 60 });
  } finally { await prisma.$disconnect(); }
}

export async function logoutAction(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const prisma = createPrismaClient(databaseUrl);
    try { await new LogoutWebSession(new PrismaWebAuthenticationRepository(prisma), new NodeOpaqueToken(), new SystemClock()).execute(await readSessionToken()); }
    finally { await prisma.$disconnect(); }
  }
  await clearSessionCookie();
  (await cookies()).delete("astu_organization");
  redirect("/login", RedirectType.replace);
}
