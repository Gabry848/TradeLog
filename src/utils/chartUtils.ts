import { Trade, ChartData } from '../types';

export const generateEquityCurveData = (trades: Trade[]): ChartData[] => {
  let runningTotal = 0;
  return trades
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((trade) => {
      runningTotal += trade.pnl;
      return {
        date: trade.date,
        value: runningTotal,
      };
    });
};

export const generateMonthlyPnLData = (trades: Trade[]): ChartData[] => {
  const monthlyData: { [key: string]: number } = {};
  trades.forEach((trade) => {
    const month = trade.date.substring(0, 7); // YYYY-MM
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
  trades.forEach((trade) => {
    const month = trade.date.substring(0, 7);
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
    const month = trade.date.substring(0, 7);
    volumeData[month] = (volumeData[month] || 0) + trade.qty * trade.price;
  });
  return Object.entries(volumeData).map(([month, volume]) => ({
    month,
    volume,
  }));
};

export const calculateTotalPnL = (trades: Trade[]): number => {
  return trades.reduce((sum, trade) => sum + trade.pnl, 0);
};

export const calculateWinRate = (trades: Trade[]): number => {
  if (trades.length === 0) return 0;
  const winningTrades = trades.filter((trade) => trade.pnl > 0).length;
  return (winningTrades / trades.length) * 100;
};
