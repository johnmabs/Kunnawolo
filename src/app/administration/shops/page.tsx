import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { BackendGap } from "../_components/backend-gap";
export const metadata: Metadata = { title: "Boutiques · Astu Sales" };
export default function ShopsPage() { return <AdministrationPage description="Gérez les points de vente de l’organisation." title="Boutiques"><BackendGap capability="ShopListProjection" description="La création sera exposée avec une liste fiable des boutiques existantes." /></AdministrationPage>; }
