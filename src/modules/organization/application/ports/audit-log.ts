export interface AuditLog {
  record(
    entry: Readonly<{
      organizationId: string;
      actorId: string | null;
      action: string;
    }>,
  ): Promise<void>;
}
