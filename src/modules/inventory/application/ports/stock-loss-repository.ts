import type { StockLoss } from "../../domain/stock-loss";
export interface StockLossRepository { record(loss: StockLoss): Promise<void>; }
