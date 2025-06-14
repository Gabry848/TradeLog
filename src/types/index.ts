// Dichiarazione per l'API Electron
declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      saveFile: (data: string, filePath: string) => Promise<void>;
    };
  }
}

export interface Trade {
  id: number;
  date: string;
  symbol: string;
  type: "Buy" | "Sell";
  qty: number;
  price: number;
  pnl: number;
  fees: number;
  strategy: string;
  [key: string]: string | number; // Per supportare campi dinamici
}

export type SortField = "date" | "symbol" | "type" | "qty" | "price" | "pnl" | "fees";
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
  price: string | null;
  date: string | null;
  strategy: string | null;
  fees: string | null;
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

export type ActiveTab = "Dashboard" | "Trades" | "Analysis" | "Settings";
