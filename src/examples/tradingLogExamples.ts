/**
 * ESEMPIO DI UTILIZZO DEL NUOVO SISTEMA DI TRADING LOG
 * 
 * Questo file mostra come utilizzare le nuove funzionalità per gestire trade
 * con entry/exit, stop loss, take profit e calcolo automatico del P&L
 */

import { Trade } from '../types';
import { 
  calculatePnL, 
  determineExitReason, 
  createOpenTrade, 
  closeTradeWithCalculation 
} from '../utils/tradeUtils';

// ESEMPIO 1: Creare un trade aperto
const createExampleOpenTrade = (): Trade => {
  return createOpenTrade(
    "AAPL",           // symbol
    "Buy",            // type
    100,              // quantity
    150.00,           // entry price
    "2025-06-15",     // entry date
    145.00,           // stop loss
    160.00,           // take profit
    "Momentum",       // strategy
    9.95              // fees
  );
};

// ESEMPIO 2: Chiudere un trade con calcolo automatico del P&L
const closeTradeExample = (): void => {
  const openTrade = createExampleOpenTrade();
  
  // Scenario 1: Chiusura manuale a profit
  const closedTrade1 = closeTradeWithCalculation(
    openTrade,
    155.50,           // exit price
    "2025-06-16",     // exit date
    0                 // additional fees
  );
  
  console.log("Trade chiuso manualmente:", {
    symbol: closedTrade1.symbol,
    entryPrice: closedTrade1.entryPrice,
    exitPrice: closedTrade1.exitPrice,
    pnl: closedTrade1.pnl,
    exitReason: closedTrade1.exitReason
  });
  
  // Scenario 2: Chiusura per stop loss
  const closedTrade2 = closeTradeWithCalculation(
    openTrade,
    145.00,           // exit price (stop loss)
    "2025-06-16",     // exit date
    0
  );
  
  console.log("Trade chiuso per stop loss:", {
    symbol: closedTrade2.symbol,
    entryPrice: closedTrade2.entryPrice,
    exitPrice: closedTrade2.exitPrice,
    pnl: closedTrade2.pnl,
    exitReason: closedTrade2.exitReason
  });
};

// ESEMPIO 3: Calcolo manuale del P&L
const calculatePnLExample = (): void => {
  // Long position
  const longPnL = calculatePnL("Buy", 100, 105, 10, 2);
  console.log("Long P&L:", longPnL); // (105-100) * 10 - 2 = 48

  // Short position
  const shortPnL = calculatePnL("Sell", 100, 95, 10, 2);
  console.log("Short P&L:", shortPnL); // (100-95) * 10 - 2 = 48
};

// ESEMPIO 4: Determinare motivo di uscita
const exitReasonExample = (): void => {
  const reason1 = determineExitReason("Buy", 145.00, 145.00, 160.00);
  console.log("Exit reason 1:", reason1); // "Stop Loss"
  
  const reason2 = determineExitReason("Buy", 160.00, 145.00, 160.00);
  console.log("Exit reason 2:", reason2); // "Take Profit"
  
  const reason3 = determineExitReason("Buy", 152.00, 145.00, 160.00);
  console.log("Exit reason 3:", reason3); // "Manual"
};

export {
  createExampleOpenTrade,
  closeTradeExample,
  calculatePnLExample,
  exitReasonExample
};
