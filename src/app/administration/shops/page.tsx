import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { ShopsView } from "./shops-view";
export const metadata: Metadata = { title: "Boutiques · Astu Sales" };
export default function ShopsPage() { return <AdministrationPage description="Gérez les points de vente de l’organisation." title="Boutiques"><ShopsView /></AdministrationPage>; }
