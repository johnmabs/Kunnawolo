import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { AccessView } from "./access-view";
export const metadata: Metadata = { title: "Accès · Astu Sales" };
export default function AccessPage() {
  return (
    <AdministrationPage
      description="Gérez les rôles et affectations aux boutiques."
      title="Accès"
    >
      <AccessView />
    </AdministrationPage>
  );
}
