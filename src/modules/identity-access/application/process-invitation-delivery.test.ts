import { describe, expect, it } from "vitest";
import type { InvitationDeliveryOutbox } from "./ports/invitation-delivery-outbox";
import { ProcessInvitationDelivery } from "./process-invitation-delivery";

const now = new Date("2026-09-03T10:00:00.000Z");
const message = {
  id: "delivery-id",
  invitationId: "invitation-id",
  email: "user@example.com",
  displayName: "User",
  organizationName: "ASTU",
  acceptanceUrl: "https://sales.example/invitations/token",
  expiresAt: new Date("2026-09-05T10:00:00.000Z"),
  attemptCount: 1,
};

class Outbox implements InvitationDeliveryOutbox {
  public sentAt: Date | null = null;
  public failure: Readonly<{ code: string; nextAttemptAt: Date }> | null = null;
  public async claim() {
    return message;
  }
  public async markSent(_id: string, sentAt: Date) {
    this.sentAt = sentAt;
  }
  public async markFailed(_id: string, code: string, nextAttemptAt: Date) {
    this.failure = { code, nextAttemptAt };
  }
}

describe("ProcessInvitationDelivery", () => {
  it("marks a delivered message and uses its stable idempotency key", async () => {
    const outbox = new Outbox();
    let key = "";
    const result = await new ProcessInvitationDelivery(
      outbox,
      {
        send: async (input) => {
          key = input.idempotencyKey;
        },
      },
      { now: () => now },
    ).execute();
    expect(result).toBe("SENT");
    expect(key).toBe("membership-invitation/delivery-id");
    expect(outbox.sentAt).toEqual(now);
  });

  it("keeps a failed message retryable with exponential backoff", async () => {
    const outbox = new Outbox();
    const result = await new ProcessInvitationDelivery(
      outbox,
      {
        send: async () => {
          throw new Error("network");
        },
      },
      { now: () => now },
    ).execute();
    expect(result).toBe("FAILED");
    expect(outbox.failure).toEqual({
      code: "iam.invitation_delivery_failed",
      nextAttemptAt: new Date("2026-09-03T10:01:00.000Z"),
    });
  });
});
