import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte · Astu Sales" };

export default function SignupPage() {
  return <AuthLayout description="Créez votre compte personnel. Votre organisation sera configurée juste après." eyebrow="Première étape" title="Créez votre compte"><SignupForm /></AuthLayout>;
}
