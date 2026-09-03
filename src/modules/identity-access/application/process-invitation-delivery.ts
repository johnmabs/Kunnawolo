import type { Clock } from "@/shared/domain/clock";
import type { InvitationDelivery } from "./ports/invitation-delivery";
import type { InvitationDeliveryOutbox } from "./ports/invitation-delivery-outbox";

export type InvitationDeliveryResult = "IDLE" | "SENT" | "FAILED";

function retryAt(now: Date, attemptCount: number): Date {
  const delayMinutes = Math.min(2 ** Math.max(0, attemptCount - 1), 24 * 60);
  return new Date(now.getTime() + delayMinutes * 60_000);
}

export class ProcessInvitationDelivery {
  public constructor(private readonly outbox: InvitationDeliveryOutbox, private readonly delivery: InvitationDelivery, private readonly clock: Clock) {}

  public async execute(id?: string): Promise<InvitationDeliveryResult> {
    const now = this.clock.now();
    const message = await this.outbox.claim({ id, now, lockedBefore: new Date(now.getTime() - 10 * 60_000) });
    if (message === null) return "IDLE";
    try {
      await this.delivery.send({ ...message, idempotencyKey: `membership-invitation/${message.id}` });
      await this.outbox.markSent(message.id, this.clock.now());
      return "SENT";
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String(error.code) : "iam.invitation_delivery_failed";
      await this.outbox.markFailed(message.id, code, retryAt(this.clock.now(), message.attemptCount));
      return "FAILED";
    }
  }
}
