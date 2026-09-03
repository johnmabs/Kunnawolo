import type { Metadata } from "next";
import { AdministrationPage } from "../_components/administration-page";
import { InviteMemberActionForm } from "./invite-member-action-form";
import { MembersList } from "./members-list";
import { createPrismaClient } from "@/infrastructure/prisma/prisma-client";
import { ListMembers } from "@/modules/identity-access/application/list-members";
import { PrismaMembershipConsultationRepository } from "@/modules/identity-access/infrastructure/prisma-membership-consultation-repository";
import { currentAdministrationContext } from "../_components/current-administration-context";
export const metadata: Metadata = { title: "Membres · Astu Sales" };
export default async function MembersPage() { const context = await currentAdministrationContext(); let items = null; if (context && process.env.DATABASE_URL && context.role === "OWNER") { const prisma = createPrismaClient(process.env.DATABASE_URL); try { const result = await new ListMembers(new PrismaMembershipConsultationRepository(prisma)).execute(context.organization.id); items = result.map((item) => ({ ...item, invitedAt: item.invitedAt.toISOString(), invitationExpiresAt: item.invitationExpiresAt?.toISOString() ?? null })); } finally { await prisma.$disconnect(); } } return <AdministrationPage description="Invitez de nouveaux utilisateurs et consultez les membres de l’organisation." title="Membres"><div className="grid gap-6"><InviteMemberActionForm /><MembersList initialItems={items ?? []} initialOrganizationId={context?.organization.id} /></div></AdministrationPage>; }
