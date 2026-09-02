import type { OperationalAlertPageQuery } from "../../domain/operational-alert-page-query";

export type OperationalAlertItem = Readonly<{ id: string; shopId: string | null; code: string; severity: string; reference: string; occurredAt: Date }>;
export type OperationalAlertPage = Readonly<{ items: readonly OperationalAlertItem[]; nextCursor: string | null }>;

export interface OperationalAlertRepository { list(query: OperationalAlertPageQuery): Promise<OperationalAlertPage>; }
