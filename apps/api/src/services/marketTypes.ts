export type MarketIndex = {
  id: string;
  name: string;
  point: number;
  changeAmt: number;
  changePct: number;
};

export type TurnoverVsPrev = "up" | "down" | "flat";

export type MarketSnapshot = {
  date: string;
  tradeDate?: string;
  snapshotType: "intraday" | "close";
  /** 是否为可入库、可参与日环比的完整收盘快照 */
  snapshotComplete?: boolean;
  snapshotAt: string;
  indices: MarketIndex[];
  breadth: { rise: number; fall: number };
  turnover: number;
  capitalInflow: number;
  available: boolean;
  message?: string;
  source?: string;
  prevTradeDate?: string | null;
  prevTurnover?: number | null;
  turnoverVsPrev?: TurnoverVsPrev | null;
  /** 较上一交易日成交额变化，单位：亿 */
  turnoverChangeAmt?: number | null;
  turnoverChangePct?: number | null;
};
