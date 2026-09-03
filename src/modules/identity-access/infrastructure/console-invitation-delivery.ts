import type { InvitationDelivery } from "../application/ports/invitation-delivery";

export class ConsoleInvitationDelivery implements InvitationDelivery {
  public async send(input: Parameters<InvitationDelivery["send"]>[0]): Promise<void> {
    console.info("Membership invitation delivery", { email: input.email, organizationName: input.organizationName, acceptanceUrl: input.acceptanceUrl, expiresAt: input.expiresAt.toISOString() });
  }
}
