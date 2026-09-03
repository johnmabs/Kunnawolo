export type InvitationDeliveryMessage = Readonly<{
  id: string;
  invitationId: string;
  email: string;
  displayName: string;
  organizationName: string;
  acceptanceUrl: string;
  expiresAt: Date;
}>;

export type ClaimedInvitationDelivery = InvitationDeliveryMessage &
  Readonly<{ attemptCount: number }>;

export interface InvitationDeliveryOutbox {
  claim(
    input: Readonly<{ id?: string; now: Date; lockedBefore: Date }>,
  ): Promise<ClaimedInvitationDelivery | null>;
  markSent(id: string, sentAt: Date): Promise<void>;
  markFailed(id: string, errorCode: string, nextAttemptAt: Date): Promise<void>;
}
