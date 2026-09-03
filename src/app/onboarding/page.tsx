import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth";
import { OrganizationForm } from "./organization-form";

export const metadata: Metadata = {
  title: "Configurer l’organisation · Astu Sales",
};
export default function OnboardingPage() {
  return (
    <AuthLayout
      description="Cette organisation regroupera vos boutiques, vos membres et vos données commerciales."
      eyebrow="Dernière étape"
      title="Créez votre organisation"
    >
      <OrganizationForm />
    </AuthLayout>
  );
}
