import { Resend, type CreateEmailOptions, type CreateEmailRequestOptions, type CreateEmailResponse } from "resend";
import { DomainError } from "@/shared/domain/domain-error";
import type { InvitationDelivery } from "../application/ports/invitation-delivery";

type SendEmail = (message: CreateEmailOptions, options: CreateEmailRequestOptions) => Promise<CreateEmailResponse>;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export class ResendInvitationDelivery implements InvitationDelivery {
  private readonly sendEmail: SendEmail;

  public constructor(apiKey: string, private readonly from: string, private readonly replyTo: string | null = null, sendEmail?: SendEmail) {
    if (!apiKey.trim() || !from.trim()) throw new DomainError("iam.invitation_delivery_unavailable", "Resend API key and sender are required.");
    const resend = new Resend(apiKey);
    this.sendEmail = sendEmail ?? ((message, options) => resend.emails.send(message, options));
  }

  public async send(input: Parameters<InvitationDelivery["send"]>[0]): Promise<void> {
    const name = escapeHtml(input.displayName);
    const organization = escapeHtml(input.organizationName);
    const url = escapeHtml(input.acceptanceUrl);
    const expiresAt = input.expiresAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });
    const response = await this.sendEmail({
      from: this.from,
      to: [input.email],
      ...(this.replyTo ? { replyTo: this.replyTo } : {}),
      subject: `Invitation à rejoindre ${input.organizationName} sur Astu Sales`,
      text: `Bonjour ${input.displayName},\n\nVous êtes invité à rejoindre ${input.organizationName} sur Astu Sales.\n\nAccepter l’invitation : ${input.acceptanceUrl}\n\nCe lien personnel expire le ${expiresAt} (UTC) et ne peut être utilisé qu’une fois.\n\nSi vous n’attendiez pas cette invitation, ignorez cet email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a"><p style="font-size:20px;font-weight:700;color:#0b2a4a">astu-sales</p><h1 style="font-size:24px">Rejoignez ${organization}</h1><p>Bonjour ${name},</p><p>Vous êtes invité à rejoindre <strong>${organization}</strong> sur Astu Sales.</p><p style="margin:28px 0"><a href="${url}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0b63ce;color:#fff;text-decoration:none;font-weight:600">Accepter l’invitation</a></p><p style="font-size:13px;color:#64748b">Ce lien personnel expire le ${escapeHtml(expiresAt)} (UTC) et ne peut être utilisé qu’une fois.</p><p style="font-size:13px;color:#64748b">Si vous n’attendiez pas cette invitation, ignorez cet email.</p></div>`,
    }, { idempotencyKey: input.idempotencyKey });
    if (response.error !== null) throw new DomainError("iam.invitation_delivery_failed", "Resend could not deliver the membership invitation.", { providerCode: response.error.name });
  }
}
