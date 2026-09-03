import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { Card, CardContent, EmptyState } from "@/components/ui";
import { currentAdministrationContext } from "../_components/current-administration-context";
export const metadata: Metadata = { title: "Organisation · Astu Sales" };
export default async function OrganizationPage() {
  const context = await currentAdministrationContext();
  return (
    <AdministrationPage
      description="Consultez le profil de l’organisation actuelle."
      title="Organisation"
    >
      {context ? (
        <Card>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <p className="text-xs text-text-secondary">Nom</p>
              <p className="mt-1 text-lg font-semibold">
                {context.organization.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Devise</p>
              <p className="mt-1 text-lg font-semibold">
                {context.organization.currency}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-text-secondary">Identifiant</p>
              <p className="mt-1 break-all text-sm">
                {context.organization.id}
              </p>
            </div>
            <p className="text-sm text-text-secondary sm:col-span-2">
              La modification du profil n’est pas exposée : aucun use case
              applicatif ne la prend actuellement en charge.
            </p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description="Aucune organisation active n’est disponible pour cette session."
          title="Organisation indisponible"
        />
      )}
    </AdministrationPage>
  );
}
