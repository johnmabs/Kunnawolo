import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { ShopsView } from "./shops-view";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { currentAdministrationContext } from "../_components/current-administration-context";
export const metadata: Metadata = { title: "Boutiques · Astu Sales" };
export default async function ShopsPage() {
  const context = await currentAdministrationContext();
  let items: readonly {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
  }[] = [];
  if (context && process.env.DATABASE_URL) {
    const prisma = createPrismaClient(process.env.DATABASE_URL);
    try {
      const permittedIds =
        context.role === "OWNER" ? undefined : context.assignedShopIds;
      items = await prisma.shop.findMany({
        where: {
          organizationId: context.organization.id,
          ...(permittedIds ? { id: { in: permittedIds } } : {}),
        },
        select: { id: true, name: true, code: true, isActive: true },
        orderBy: { name: "asc" },
      });
    } finally {
      await prisma.$disconnect();
    }
  }
  return (
    <AdministrationPage
      description="Gérez les points de vente de l’organisation."
      title="Boutiques"
    >
      <ShopsView items={items} key={context?.organization.id} />
    </AdministrationPage>
  );
}
