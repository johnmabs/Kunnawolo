import type { InvitationDelivery } from "@/modules/identity-access/application/ports/invitation-delivery";
import { ConsoleInvitationDelivery } from "@/modules/identity-access/infrastructure/console-invitation-delivery";
import { ResendInvitationDelivery } from "@/modules/identity-access/infrastructure/resend-invitation-delivery";

export type ConfiguredInvitationDelivery = Readonly<{ delivery: InvitationDelivery; mode: "email" | "manual" }>;

export function configuredInvitationDelivery(): ConfiguredInvitationDelivery | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (apiKey && from) return { delivery: new ResendInvitationDelivery(apiKey, from, process.env.RESEND_REPLY_TO?.trim() || null), mode: "email" };
  if (process.env.NODE_ENV === "production") return null;
  return { delivery: new ConsoleInvitationDelivery(), mode: "manual" };
}
