import type { Metadata } from "next";
import { PageContainer } from "@/components/layout";
import { EmptyState, PageHeader } from "@/components/ui";
export const metadata: Metadata = { title: "Catégories · Astu Sales" };
export default function CategoriesPage() {
  return (
    <PageContainer>
      <PageHeader
        description="Classez les produits pour faciliter leur gestion."
        title="Catégories"
      />
      <EmptyState
        className="mt-6"
        description={
          <>
            <strong>BACKEND GAP: CategoryListProjection</strong>
            <br />
            La création ne sera exposée qu’avec une liste permettant de vérifier
            et gérer les catégories existantes.
          </>
        }
        title="Liste des catégories indisponible"
      />
    </PageContainer>
  );
}
