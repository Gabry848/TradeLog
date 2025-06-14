import { Trade, TradeField, DefaultValues } from '../types';

export const getDefaultValue = (fieldType: string, fieldId: string, defaultValues: DefaultValues): string => {
  // Usa i valori di default configurabili se disponibili
  if (defaultValues[fieldId]) {
    return defaultValues[fieldId];
  }
  
  switch (fieldType) {
    case 'number':
      return '0';
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'text':
      if (fieldId === 'type') return 'Buy';
      if (fieldId === 'strategy') return 'Unknown';
      return '';
    default:
      return '';
  }
};

export const initializeTradeFields = (trade: Trade, tradeFields: TradeField[], defaultValues: DefaultValues): Trade => {
  const initializedTrade = { ...trade };
  
  // Assicurati che tutti i campi configurati abbiano un valore
  tradeFields.forEach(field => {
    if (initializedTrade[field.id] === undefined || initializedTrade[field.id] === null || initializedTrade[field.id] === '') {
      if (field.type === 'number') {
        initializedTrade[field.id] = parseFloat(getDefaultValue(field.type, field.id, defaultValues));
      } else {
        initializedTrade[field.id] = getDefaultValue(field.type, field.id, defaultValues);
      }
    }
  });
    
  return initializedTrade;
};

export const validateCellValue = (fieldId: string, value: string, fieldType: string): string | null => {
  if (fieldType === 'number') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    if (fieldId === 'qty' && num < 0) {
      return 'Quantity cannot be negative';
    }
    if (fieldId === 'price' && num < 0) {
      return 'Price cannot be negative';
    }
  }
  
  if (fieldId === 'symbol' && value.trim().length === 0) {
    return 'Symbol is required';
  }
  
  if (fieldId === 'date' && fieldType === 'date') {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Must be a valid date';
    }
  }
  
  return null; // No error
};

/**
 * Calcola il P&L di un trade in base ai prezzi di entrata e uscita
 */
export const calculatePnL = (
  type: "Buy" | "Sell",
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  fees: number = 0
): number => {
  let pnl = 0;
  
  if (type === "Buy") {
    // Long position: guadagno quando il prezzo sale
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    // Short position: guadagno quando il prezzo scende
    pnl = (entryPrice - exitPrice) * quantity;
  }
  
  // Sottrai le commissioni
  return pnl - fees;
};

/**
 * Determina il motivo di uscita in base ai prezzi
 */
export const determineExitReason = (
  type: "Buy" | "Sell",
  exitPrice: number,
  stopLoss?: number,
  takeProfit?: number
): "Stop Loss" | "Take Profit" | "Manual" => {
  // Controlla se ha colpito lo stop loss (con tolleranza di 0.01)
  if (stopLoss !== undefined) {
    if (type === "Buy" && exitPrice <= stopLoss + 0.01) {
      return "Stop Loss";
    }
    if (type === "Sell" && exitPrice >= stopLoss - 0.01) {
      return "Stop Loss";
    }
  }
  
  // Controlla se ha colpito il take profit (con tolleranza di 0.01)
  if (takeProfit !== undefined) {
    if (type === "Buy" && exitPrice >= takeProfit - 0.01) {
      return "Take Profit";
    }
    if (type === "Sell" && exitPrice <= takeProfit + 0.01) {
      return "Take Profit";
    }
  }
  
  return "Manual";
};

/**
 * Aggiorna un trade con i dati di uscita e calcola automaticamente il P&L
 */
export const closeTradeWithCalculation = (
  trade: Trade,
  exitPrice: number,
  exitDate: string,
  fees: number = 0
): Trade => {  const exitReason = determineExitReason(
    trade.type,
    exitPrice,
    trade.stopLoss,
    trade.takeProfit
  );
  
  const pnl = calculatePnL(
    trade.type,
    trade.entryPrice,
    exitPrice,
    trade.qty,
    trade.fees + fees
  );
  
  return {
    ...trade,
    exitPrice,
    exitDate,
    exitReason,
    pnl,
    status: "Closed",
    // Aggiorna campi legacy per compatibilità
    date: exitDate,
    price: exitPrice
  };
};

/**
 * Crea un nuovo trade aperto
 */
export const createOpenTrade = (
  symbol: string,
  type: "Buy" | "Sell",
  qty: number,
  entryPrice: number,
  entryDate: string,
  stopLoss?: number,
  takeProfit?: number,
  strategy: string = "Manual",
  fees: number = 0
): Trade => {
  return {
    id: Date.now(),
    entryDate,
    symbol,
    type,
    qty,
    entryPrice,
    stopLoss,
    takeProfit,
    pnl: 0,
    fees,
    strategy,
    status: "Open",
    // Campi legacy
    date: entryDate,
    price: entryPrice,
  };
};

/**
 * Migra trade legacy al nuovo formato con entry/exit
 */
export const migrateLegacyTrade = (trade: Trade): Trade => {
  // Se il trade ha già i nuovi campi, restituiscilo com'è
  if (trade.entryPrice !== undefined && trade.entryDate !== undefined) {
    return trade;
  }
  
  // Migrazione da formato legacy
  const migratedTrade: Trade = {
    ...trade,
    entryDate: trade.date,
    entryPrice: trade.price,
    status: trade.pnl !== 0 ? "Closed" : "Open",
  };
  
  // Se il trade ha un P&L diverso da 0, considera che sia stato chiuso
  if (trade.pnl !== 0) {
    migratedTrade.exitDate = trade.date;
    migratedTrade.exitPrice = trade.price;
    migratedTrade.exitReason = "Manual";
    migratedTrade.status = "Closed";
  }
  
  return migratedTrade;
};

/**
 * Migra un array di trade legacy
 */
export const migrateLegacyTrades = (trades: Trade[]): Trade[] => {
  return trades.map(migrateLegacyTrade);
};
