"use server";

import { redirect, RedirectType } from "next/navigation";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { UuidIdentifierGenerator } from "@/infrastructure/identifiers/uuid-identifier-generator";
import { IssueWebSession } from "@/modules/identity-access/application/issue-web-session";
import { RegisterWithPassword } from "@/modules/identity-access/application/register-with-password";
import { NodeOpaqueToken } from "@/modules/identity-access/infrastructure/node-opaque-token";
import { NodePasswordHasher } from "@/modules/identity-access/infrastructure/node-password-hasher";
import { PrismaWebAuthenticationRepository } from "@/modules/identity-access/infrastructure/prisma-web-authentication-repository";
import { SystemClock } from "@/shared/infrastructure/system-clock";
import { writeSessionCookie } from "@/app/api/auth/_shared/session-cookie";

export type SignupState = Readonly<{ error: string | null }>;

function errorMessage(error: unknown): string {
  const code =
    error instanceof Error && "code" in error ? String(error.code) : "";
  if (code === "auth.email_taken")
    return "Un compte existe déjà avec cette adresse email. Connectez-vous pour continuer.";
  if (code === "auth.password_too_short")
    return "Choisissez une phrase de passe d’au moins 15 caractères.";
  if (code === "auth.password_too_long")
    return "Le mot de passe ne peut pas dépasser 128 caractères.";
  return "La création du compte est momentanément impossible. Réessayez.";
}

export async function signupAction(
  _previous: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    return {
      error: "Le service d’inscription est momentanément indisponible.",
    };
  const displayName = formData.get("displayName");
  const email = formData.get("email");
  const password = formData.get("password");
  if (
    typeof displayName !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  )
    return { error: "Vérifiez les informations du formulaire." };
  const prisma = createPrismaClient(databaseUrl);
  try {
    const repository = new PrismaWebAuthenticationRepository(prisma);
    const account = await new RegisterWithPassword(
      repository,
      new NodePasswordHasher(),
      new UuidIdentifierGenerator(),
    ).execute({ displayName, email, password });
    const opaqueTokens = new NodeOpaqueToken();
    const session = await new IssueWebSession(
      repository,
      new UuidIdentifierGenerator(),
      opaqueTokens,
      opaqueTokens,
      new SystemClock(),
    ).execute(account.id.value);
    await writeSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    return { error: errorMessage(error) };
  } finally {
    await prisma.$disconnect();
  }
  redirect("/onboarding", RedirectType.replace);
}
