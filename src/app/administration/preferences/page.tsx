import type { Metadata } from "next";
import { WorkspaceSettings } from "@/app/_components/workspace-settings";
import { AdministrationPage } from "../_components/administration-page";
export const metadata: Metadata = { title: "Préférences · Astu Sales" };
export default function PreferencesPage() {
  return (
    <AdministrationPage
      description="Configurez la boutique de travail et la densité de l’interface."
      title="Préférences"
    >
      <WorkspaceSettings />
    </AdministrationPage>
  );
}
