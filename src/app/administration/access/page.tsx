import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { BackendGap } from "../_components/backend-gap";
export const metadata: Metadata = { title: "Accès · Astu Sales" };
export default function AccessPage() { return <AdministrationPage description="Gérez les rôles et affectations aux boutiques." title="Accès"><BackendGap capability="AccessManagementUseCases" description="Les ports d’affectation existent, mais aucun workflow applicatif ne permet encore de modifier les accès." /></AdministrationPage>; }
