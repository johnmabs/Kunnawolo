import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { AuthLayout } from "@/components/auth";

export const metadata: Metadata = { title: "Connexion · Astu Sales" };

export default async function LoginPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ next?: string }> }>) {
  const { next } = await searchParams;
  return (
    <AuthLayout
      description="Retrouvez votre organisation et votre boutique de travail."
      eyebrow="Bienvenue"
      title="Connectez-vous à votre espace"
    >
      <LoginForm next={next} />
    </AuthLayout>
  );
}
