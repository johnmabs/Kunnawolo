export type MembershipListItem = Readonly<{
  id: string;
  userAccountId: string;
  displayName: string;
  email: string;
  status: "INVITED" | "ACTIVE" | "INACTIVE";
  role: string;
  invitedAt: Date;
  invitationExpiresAt: Date | null;
  invitationId: string | null;
  invitationDeliveryStatus:
    "PENDING" | "PROCESSING" | "FAILED" | "SENT" | "CANCELLED" | null;
  invitationDeliveryAttempts: number;
  shopIds: readonly string[];
}>;

export interface MembershipConsultationRepository {
  list(organizationId: string): Promise<readonly MembershipListItem[]>;
}
