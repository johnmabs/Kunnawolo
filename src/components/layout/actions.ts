"use server";

import { redirect, RedirectType } from "next/navigation";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { LogoutWebSession } from "@/modules/identity-access/application/logout-web-session";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { clearSessionCookie, readSessionToken } from "@/app/api/auth/_shared/session-cookie";

export async function logoutAction(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const prisma = createPrismaClient(databaseUrl);
    try { await new LogoutWebSession(new PrismaWebAuthenticationRepository(prisma), new NodeOpaqueToken(), new SystemClock()).execute(await readSessionToken()); }
    finally { await prisma.$disconnect(); }
  }
  await clearSessionCookie();
  redirect("/login", RedirectType.replace);
}
