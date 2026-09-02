import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { OrganizationView } from "./organization-view";
export const metadata: Metadata = { title: "Organisation · Astu Sales" };
export default function OrganizationPage() { return <AdministrationPage description="Consultez le profil de l’organisation actuelle." title="Organisation"><OrganizationView /></AdministrationPage>; }
