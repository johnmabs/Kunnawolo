import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { BackendGap } from "../_components/backend-gap";
export const metadata: Metadata = { title: "Membres · Astu Sales" };
export default function MembersPage() { return <AdministrationPage description="Consultez les membres et leurs statuts." title="Membres"><BackendGap capability="MembershipListProjection" description="L’invitation accepte bien email et nom, mais la liste et l’autorisation explicite de l’invitant manquent encore." /></AdministrationPage>; }
