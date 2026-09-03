import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { InviteMemberActionForm } from "./invite-member-action-form";
import { MembersList } from "./members-list";
export const metadata: Metadata = { title: "Membres · Astu Sales" };
export default function MembersPage() { return <AdministrationPage description="Invitez de nouveaux utilisateurs et consultez les membres de l’organisation." title="Membres"><div className="grid gap-6"><InviteMemberActionForm /><MembersList /></div></AdministrationPage>; }
