import { Trade, ChartData } from '../types';

export const generateEquityCurveData = (trades: Trade[]): ChartData[] => {
  let runningTotal = 0;
  return trades
    .filter(trade => trade.status === "Closed" || !trade.status) // Include trade legacy
    .sort((a, b) => new Date(a.exitDate || a.date).getTime() - new Date(b.exitDate || b.date).getTime())
    .map((trade) => {
      runningTotal += trade.pnl;
      return {
        date: trade.exitDate || trade.date,
        value: runningTotal,
      };
    });
};

export const generateMonthlyPnLData = (trades: Trade[]): ChartData[] => {
  const monthlyData: { [key: string]: number } = {};
  trades
    .filter(trade => trade.status === "Closed")
    .forEach((trade) => {
      const month = (trade.exitDate || trade.entryDate).substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + trade.pnl;
    });
  return Object.entries(monthlyData).map(([month, pnl]) => ({ month, pnl }));
};

export const generateSymbolDistribution = (trades: Trade[]): ChartData[] => {
  const symbolData: { [key: string]: number } = {};
  trades.forEach((trade) => {
    symbolData[trade.symbol] = (symbolData[trade.symbol] || 0) + 1;
  });
  return Object.entries(symbolData).map(([symbol, count]) => ({
    symbol,
    count,
  }));
};

export const generateStrategyPerformance = (trades: Trade[]): ChartData[] => {
  const strategyData: { [key: string]: { pnl: number; trades: number } } = {};
  trades.forEach((trade) => {
    if (!strategyData[trade.strategy]) {
      strategyData[trade.strategy] = { pnl: 0, trades: 0 };
    }
    strategyData[trade.strategy].pnl += trade.pnl;
    strategyData[trade.strategy].trades += 1;
  });
  return Object.entries(strategyData).map(([strategy, data]) => ({
    strategy,
    pnl: data.pnl,
    avgPnL: data.pnl / data.trades,
    trades: data.trades,
  }));
};

export const generateWinRateData = (trades: Trade[]): ChartData[] => {
  const monthlyWinRate: { [key: string]: { wins: number; total: number } } = {};
  trades
    .filter(trade => trade.status === "Closed")
    .forEach((trade) => {
      const month = (trade.exitDate || trade.entryDate).substring(0, 7);
      if (!monthlyWinRate[month]) {
        monthlyWinRate[month] = { wins: 0, total: 0 };
      }
      monthlyWinRate[month].total += 1;
      if (trade.pnl > 0) monthlyWinRate[month].wins += 1;
    });
  return Object.entries(monthlyWinRate).map(([month, data]) => ({
    month,
    winRate: (data.wins / data.total) * 100,
  }));
};

export const generateVolumeData = (trades: Trade[]): ChartData[] => {
  const volumeData: { [key: string]: number } = {};
  trades.forEach((trade) => {
    const month = (trade.exitDate || trade.entryDate).substring(0, 7);
    volumeData[month] = (volumeData[month] || 0) + trade.qty * trade.entryPrice;
  });
  return Object.entries(volumeData).map(([month, volume]) => ({
    month,
    volume,
  }));
};

export const calculateTotalPnL = (trades: Trade[]): number => {
  return trades
    .filter(trade => trade.status === "Closed" || !trade.status) // Include trade legacy senza status
    .reduce((sum, trade) => sum + trade.pnl, 0);
};

export const calculateWinRate = (trades: Trade[]): number => {
  const closedTrades = trades.filter(trade => trade.status === "Closed" || !trade.status); // Include trade legacy
  if (closedTrades.length === 0) return 0;
  const winningTrades = closedTrades.filter((trade) => trade.pnl > 0).length;
  return (winningTrades / closedTrades.length) * 100;
};
