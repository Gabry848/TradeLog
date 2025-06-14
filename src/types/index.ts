export interface Trade {
  id: number;
  entryDate: string;
  exitDate?: string;
  symbol: string;
  type: "Buy" | "Sell";
  qty: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  exitReason?: "Stop Loss" | "Take Profit" | "Manual" | "Time" | "Partial";
  pnl: number;
  fees: number;
  strategy: string;
  status: "Open" | "Closed";
  // Nuovi campi per tracking profit target
  hitProfitTarget?: boolean;
  actualEntryPrice?: number;
  actualExitPrice?: number;
  // Campi legacy per compatibilità
  date: string;
  price: number;
  [key: string]: string | number | boolean | undefined; // Per supportare campi dinamici
}

export type SortField = "entryDate" | "exitDate" | "symbol" | "type" | "qty" | "entryPrice" | "exitPrice" | "pnl" | "fees" | "status" | "hitProfitTarget" | "actualEntryPrice" | "actualExitPrice" | "date" | "price";
export type SortDirection = "asc" | "desc";

export interface FilterState {
  symbol: string;
  type: string;
  strategy: string;
  dateFrom: string;
  dateTo: string;
  minPnL: string;
  maxPnL: string;
}

export interface NewTradeData {
  symbol: string | null;
  type: string | null;
  qty: string | null;
  entryPrice: string | null;
  exitPrice: string | null;
  entryDate: string | null;
  exitDate: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  exitReason: string | null;
  strategy: string | null;
  fees: string | null;
  status: string | null;
  // Nuovi campi per tracking profit target
  hitProfitTarget: string | null;
  actualEntryPrice: string | null;
  actualExitPrice: string | null;
  // Campi legacy
  price: string | null;
  date: string | null;
  pnl: string | null;
}

export interface TradeField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  enabled: boolean;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "area";
  dataSource: "pnl" | "volume" | "symbols" | "strategies" | "winRate";
  enabled: boolean;
  position: number;
}

export interface EditingCell {
  tradeId: number;
  fieldId: string;
}

export interface ErrorCell {
  tradeId: number;
  fieldId: string;
  message: string;
}

export interface DefaultValues {
  [key: string]: string;
}

export interface ChartData {
  date?: string;
  month?: string;
  value?: number;
  pnl?: number;
  symbol?: string;
  count?: number;
  strategy?: string;
  avgPnL?: number;
  trades?: number;
  winRate?: number;
  volume?: number;
}

export type ActiveTab = "Dashboard" | "Trades" | "Analysis" | "Settings" | "CustomCharts";

// Nuovi tipi per i grafici personalizzati
export interface CustomChartScript {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: ChartParameter[];
  chartType: "line" | "bar" | "pie" | "area" | "scatter";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChartParameter {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "date" | "select";
  defaultValue: string | number | boolean;
  options?: string[];
  required: boolean;
  description?: string;
}

export interface CustomChartData {
  labels: string[];
  datasets: ChartDataset[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartExecutionContext {
  trades: Trade[];
  parameters: { [key: string]: string | number | boolean };
  utils: {
    formatCurrency: (value: number) => string;
    formatDate: (date: string) => string;
    groupByMonth: (trades: Trade[]) => { [month: string]: Trade[] };
    groupBySymbol: (trades: Trade[]) => { [symbol: string]: Trade[] };
    groupByStrategy: (trades: Trade[]) => { [strategy: string]: Trade[] };
    calculateMetrics: (trades: Trade[]) => ChartMetrics;
  };
}

export interface ChartMetrics {
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
}
