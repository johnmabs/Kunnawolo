export interface InvitationDelivery {
  send(
    input: Readonly<{
      email: string;
      displayName: string;
      organizationName: string;
      acceptanceUrl: string;
      expiresAt: Date;
      idempotencyKey: string;
    }>,
  ): Promise<void>;
}
