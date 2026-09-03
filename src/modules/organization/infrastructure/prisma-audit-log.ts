import type { PrismaClient } from "@/infrastructure/prisma/generated/client";

import type { AuditLog } from "../application/ports/audit-log";

export class PrismaAuditLog implements AuditLog {
  public constructor(private readonly prisma: PrismaClient) {}

  public async record(
    entry: Readonly<{
      organizationId: string;
      actorId: string | null;
      action: string;
    }>,
  ): Promise<void> {
    await this.prisma.organizationAudit.create({
      data: {
        id: crypto.randomUUID(),
        organizationId: entry.organizationId,
        actorId: entry.actorId,
        action: entry.action,
      },
    });
  }
}
