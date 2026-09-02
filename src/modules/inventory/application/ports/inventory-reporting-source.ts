export type InventoryReportingData = Readonly<{ onHandQuantity: number; lossQuantity: number; anomalyCount: number }>;

export interface InventoryReportingSource {
  projectStock(input: Readonly<{ organizationId: string; shopId: string | null; occurredFrom: Date | null; occurredTo: Date | null }>): Promise<InventoryReportingData>;
}
