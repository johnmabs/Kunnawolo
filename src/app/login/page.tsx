import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { AuthLayout } from "@/components/auth";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Connexion · Astu Sales" };

export default function LoginPage() {
  return <AuthLayout description="Retrouvez votre organisation et votre boutique de travail." eyebrow="Bienvenue" title="Connectez-vous à votre espace"><Suspense><LoginForm /></Suspense></AuthLayout>;
}
