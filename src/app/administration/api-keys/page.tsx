import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { ApiKeysView } from "./api-keys-view";
export const metadata: Metadata = { title: "Clés API · Astu Sales" };
export default function ApiKeysPage() { return <AdministrationPage description="Créez les accès techniques de l’organisation." title="Clés API"><ApiKeysView /></AdministrationPage>; }
