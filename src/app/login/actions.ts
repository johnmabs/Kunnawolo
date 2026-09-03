"use server";

import { redirect, RedirectType } from "next/navigation";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { IssueWebSession } from "@/modules/identity-access/application/issue-web-session";
import { LoginWithPassword } from "@/modules/identity-access/application/login-with-password";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { NodePasswordHasher } from "@/modules/identity-access/infrastructure/node-password-hasher";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { writeSessionCookie } from "@/app/api/auth/_shared/session-cookie";

export type LoginState = Readonly<{ error: string | null }>;

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    return { error: "Le service de connexion est momentanément indisponible." };
  const email = formData.get("email");
  const password = formData.get("password");
  const requestedNext = formData.get("next");
  if (typeof email !== "string" || typeof password !== "string")
    return { error: "Vérifiez les informations du formulaire." };
  const prisma = createPrismaClient(databaseUrl);
  try {
    const repository = new PrismaWebAuthenticationRepository(prisma);
    const account = await new LoginWithPassword(
      repository,
      new NodePasswordHasher(),
    ).execute({ email, password });
    const opaqueTokens = new NodeOpaqueToken();
    const session = await new IssueWebSession(
      repository,
      new UuidIdentifierGenerator(),
      opaqueTokens,
      opaqueTokens,
      new SystemClock(),
    ).execute(account.id.value);
    await writeSessionCookie(session.token, session.expiresAt);
  } catch {
    return { error: "L’adresse email ou le mot de passe est incorrect." };
  } finally {
    await prisma.$disconnect();
  }
  const destination =
    typeof requestedNext === "string" &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/";
  redirect(destination, RedirectType.replace);
}
