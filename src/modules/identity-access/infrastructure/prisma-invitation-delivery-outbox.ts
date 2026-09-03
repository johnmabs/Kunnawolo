import type { PrismaClient } from "@/infrastructure/prisma/generated/client";
import type { InvitationDeliveryOutbox } from "../application/ports/invitation-delivery-outbox";

export class PrismaInvitationDeliveryOutbox implements InvitationDeliveryOutbox {
  public constructor(private readonly prisma: PrismaClient) {}

  public async claim(input: Parameters<InvitationDeliveryOutbox["claim"]>[0]) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const row = await this.prisma.invitationDeliveryOutbox.findFirst({
        where: {
          ...(input.id ? { id: input.id } : {}),
          acceptanceUrl: { not: null },
          expiresAt: { gt: input.now },
          OR: [
            { status: { in: ["PENDING", "FAILED"] }, nextAttemptAt: { lte: input.now } },
            { status: "PROCESSING", lockedAt: { lte: input.lockedBefore } },
          ],
        },
        orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
      });
      if (row === null || row.acceptanceUrl === null) return null;
      const claimed = await this.prisma.invitationDeliveryOutbox.updateMany({
        where: { id: row.id, status: row.status, updatedAt: row.updatedAt },
        data: { status: "PROCESSING", lockedAt: input.now, attemptCount: { increment: 1 } },
      });
      if (claimed.count === 1) return { id: row.id, invitationId: row.invitationId, email: row.email, displayName: row.displayName, organizationName: row.organizationName, acceptanceUrl: row.acceptanceUrl, expiresAt: row.expiresAt, attemptCount: row.attemptCount + 1 };
    }
    return null;
  }

  public async markSent(id: string, sentAt: Date) {
    await this.prisma.invitationDeliveryOutbox.update({ where: { id }, data: { status: "SENT", sentAt, lockedAt: null, lastErrorCode: null, acceptanceUrl: null } });
  }

  public async markFailed(id: string, errorCode: string, nextAttemptAt: Date) {
    await this.prisma.invitationDeliveryOutbox.update({ where: { id }, data: { status: "FAILED", lockedAt: null, lastErrorCode: errorCode.slice(0, 128), nextAttemptAt } });
  }
}
