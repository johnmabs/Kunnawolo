import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth";
import { InvitationAcceptance } from "./invitation-acceptance";

export const metadata: Metadata = { title: "Accepter l’invitation · Astu Sales" };
export default async function InvitationPage({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  return <AuthLayout description="Vérifiez les informations ci-dessous avant de rejoindre l’espace de travail." eyebrow="Invitation" title="Rejoindre une organisation"><InvitationAcceptance token={token} /></AuthLayout>;
}
