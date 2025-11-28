import { CustomChartScript } from '../types';

/**
 * Store di grafici predefiniti avanzati
 * Questi template offrono analisi sofisticate pronte all'uso
 */

export const chartTemplates: CustomChartScript[] = [
  {
    id: 'template-monthly-performance',
    name: 'Monthly Performance Breakdown',
    description: 'Detailed monthly P&L analysis with win rate overlay',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const monthlyData = utils.groupByMonth(trades);
  const months = Object.keys(monthlyData).sort();

  const datasets = [
    {
      label: 'P&L',
      data: months.map(month => {
        const monthTrades = monthlyData[month];
        return monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      }),
      backgroundColor: months.map(month => {
        const pnl = monthlyData[month].reduce((sum, t) => sum + (t.pnl || 0), 0);
        return pnl >= 0 ? '#10b981' : '#ef4444';
      }),
      borderWidth: 0,
    },
  ];

  return {
    labels: months,
    datasets,
    title: 'Monthly Performance',
    xAxisLabel: 'Month',
    yAxisLabel: 'P&L ($)',
  };
}
    `
  },
  {
    id: 'template-symbol-heatmap',
    name: 'Symbol Performance Heatmap',
    description: 'Performance comparison across all traded symbols',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [
      {
        id: 'minTrades',
        name: 'Minimum Trades',
        type: 'number',
        defaultValue: 3,
        required: false,
        description: 'Only show symbols with at least this many trades'
      }
    ],
    code: `
function generateChart() {
  const minTrades = parameters.minTrades || 3;
  const symbolData = utils.groupBySymbol(trades);

  const symbols = Object.keys(symbolData)
    .filter(symbol => symbolData[symbol].length >= minTrades)
    .sort((a, b) => {
      const aPnl = symbolData[a].reduce((sum, t) => sum + (t.pnl || 0), 0);
      const bPnl = symbolData[b].reduce((sum, t) => sum + (t.pnl || 0), 0);
      return bPnl - aPnl;
    });

  const datasets = [
    {
      label: 'Total P&L',
      data: symbols.map(symbol =>
        symbolData[symbol].reduce((sum, t) => sum + (t.pnl || 0), 0)
      ),
      backgroundColor: symbols.map(symbol => {
        const pnl = symbolData[symbol].reduce((sum, t) => sum + (t.pnl || 0), 0);
        return pnl >= 0 ? '#10b981' : '#ef4444';
      }),
    },
  ];

  return {
    labels: symbols,
    datasets,
    title: \`Symbol Performance (min \${minTrades} trades)\`,
    xAxisLabel: 'Symbol',
    yAxisLabel: 'Total P&L ($)',
  };
}
    `
  },
  {
    id: 'template-win-loss-distribution',
    name: 'Win/Loss Distribution',
    description: 'Distribution of winning vs losing trades by size',
    chartType: 'scatter',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const winners = trades.filter(t => (t.pnl || 0) > 0);
  const losers = trades.filter(t => (t.pnl || 0) < 0);

  const datasets = [
    {
      label: 'Winning Trades',
      data: winners.map((t, i) => ({ x: i + 1, y: t.pnl || 0 })),
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      borderWidth: 2,
    },
    {
      label: 'Losing Trades',
      data: losers.map((t, i) => ({ x: i + 1, y: t.pnl || 0 })),
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
      borderWidth: 2,
    },
  ];

  return {
    labels: [],
    datasets,
    title: 'Win/Loss Distribution',
    xAxisLabel: 'Trade Number',
    yAxisLabel: 'P&L ($)',
  };
}
    `
  },
  {
    id: 'template-strategy-comparison',
    name: 'Strategy Performance Comparison',
    description: 'Compare performance metrics across different strategies',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const strategyData = utils.groupByStrategy(trades);
  const strategies = Object.keys(strategyData).filter(s => s && s.trim() !== '');

  const metrics = strategies.map(strategy => {
    const stratTrades = strategyData[strategy];
    const wins = stratTrades.filter(t => (t.pnl || 0) > 0).length;
    const totalPnl = stratTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = stratTrades.length > 0 ? (wins / stratTrades.length) * 100 : 0;

    return {
      strategy,
      totalPnl,
      winRate,
      trades: stratTrades.length,
    };
  });

  const datasets = [
    {
      label: 'Total P&L',
      data: metrics.map(m => m.totalPnl),
      backgroundColor: '#3b82f6',
    },
  ];

  return {
    labels: metrics.map(m => \`\${m.strategy} (n=\${m.trades})\`),
    datasets,
    title: 'Strategy Comparison',
    xAxisLabel: 'Strategy',
    yAxisLabel: 'Total P&L ($)',
  };
}
    `
  },
  {
    id: 'template-time-of-day',
    name: 'Performance by Time of Day',
    description: 'Analyze trading performance by hour of entry',
    chartType: 'line',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const hourlyData = {};

  trades.forEach(trade => {
    if (!trade.entryDate) return;
    const hour = new Date(trade.entryDate).getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { pnl: 0, count: 0, wins: 0 };
    }
    hourlyData[hour].pnl += trade.pnl || 0;
    hourlyData[hour].count += 1;
    if ((trade.pnl || 0) > 0) hourlyData[hour].wins += 1;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const avgPnl = hours.map(h => {
    const data = hourlyData[h];
    return data ? data.pnl / data.count : 0;
  });

  const datasets = [
    {
      label: 'Avg P&L per Trade',
      data: avgPnl,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      fill: true,
    },
  ];

  return {
    labels: hours.map(h => \`\${h}:00\`),
    datasets,
    title: 'Performance by Time of Day',
    xAxisLabel: 'Hour',
    yAxisLabel: 'Avg P&L ($)',
  };
}
    `
  },
  {
    id: 'template-risk-reward',
    name: 'Risk/Reward Analysis',
    description: 'Analyze actual risk vs reward ratios achieved',
    chartType: 'scatter',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const tradesWithRR = trades.filter(t =>
    t.entryPrice && t.stopLoss && t.takeProfit
  );

  const data = tradesWithRR.map(t => {
    const risk = Math.abs(t.entryPrice - (t.stopLoss || 0));
    const reward = Math.abs((t.takeProfit || 0) - t.entryPrice);
    const rrRatio = risk > 0 ? reward / risk : 0;
    const actualPnl = t.pnl || 0;

    return {
      x: rrRatio,
      y: actualPnl,
      label: t.symbol,
    };
  });

  const datasets = [
    {
      label: 'Trades',
      data: data,
      backgroundColor: data.map(d => d.y >= 0 ? '#10b981' : '#ef4444'),
      borderColor: data.map(d => d.y >= 0 ? '#10b981' : '#ef4444'),
      borderWidth: 2,
    },
  ];

  return {
    labels: [],
    datasets,
    title: 'Risk/Reward vs Actual P&L',
    xAxisLabel: 'Risk/Reward Ratio',
    yAxisLabel: 'Actual P&L ($)',
  };
}
    `
  },
  {
    id: 'template-consecutive-analysis',
    name: 'Winning/Losing Streaks',
    description: 'Identify patterns in consecutive wins and losses',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const sortedTrades = [...trades]
    .filter(t => t.status === 'Closed')
    .sort((a, b) =>
      new Date(a.exitDate || a.entryDate).getTime() -
      new Date(b.exitDate || b.entryDate).getTime()
    );

  const streaks = [];
  let currentStreak = { type: null, count: 0, totalPnl: 0 };

  sortedTrades.forEach(trade => {
    const isWin = (trade.pnl || 0) > 0;
    const type = isWin ? 'win' : 'loss';

    if (currentStreak.type === type) {
      currentStreak.count++;
      currentStreak.totalPnl += trade.pnl || 0;
    } else {
      if (currentStreak.count > 0) {
        streaks.push({ ...currentStreak });
      }
      currentStreak = { type, count: 1, totalPnl: trade.pnl || 0 };
    }
  });

  if (currentStreak.count > 0) streaks.push(currentStreak);

  const datasets = [
    {
      label: 'Streak Impact',
      data: streaks.map(s => s.totalPnl),
      backgroundColor: streaks.map(s => s.type === 'win' ? '#10b981' : '#ef4444'),
    },
  ];

  return {
    labels: streaks.map((s, i) => \`\${s.type === 'win' ? 'W' : 'L'}\${s.count}\`),
    datasets,
    title: 'Winning/Losing Streaks Impact',
    xAxisLabel: 'Streak (W=Win, L=Loss)',
    yAxisLabel: 'Total P&L ($)',
  };
}
    `
  },
  {
    id: 'template-profit-factor',
    name: 'Monthly Profit Factor',
    description: 'Track profit factor evolution month by month',
    chartType: 'line',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const monthlyData = utils.groupByMonth(trades);
  const months = Object.keys(monthlyData).sort();

  const profitFactors = months.map(month => {
    const monthTrades = monthlyData[month];
    const grossProfit = monthTrades
      .filter(t => (t.pnl || 0) > 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(monthTrades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0));

    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 10 : 0;
  });

  const datasets = [
    {
      label: 'Profit Factor',
      data: profitFactors,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10b981',
      borderWidth: 3,
      fill: true,
    },
  ];

  return {
    labels: months,
    datasets,
    title: 'Monthly Profit Factor Evolution',
    xAxisLabel: 'Month',
    yAxisLabel: 'Profit Factor',
  };
}
    `
  },
  {
    id: 'template-drawdown',
    name: 'Drawdown Analysis',
    description: 'Visualize equity drawdowns over time',
    chartType: 'area',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const sortedTrades = [...trades]
    .filter(t => t.status === 'Closed')
    .sort((a, b) =>
      new Date(a.exitDate || a.entryDate).getTime() -
      new Date(b.exitDate || b.entryDate).getTime()
    );

  let equity = 0;
  let peak = 0;
  const drawdowns = [];
  const labels = [];

  sortedTrades.forEach((trade, i) => {
    equity += trade.pnl || 0;
    peak = Math.max(peak, equity);
    const drawdown = peak - equity;
    drawdowns.push(drawdown);
    labels.push(\`Trade \${i + 1}\`);
  });

  const maxDrawdown = Math.max(...drawdowns);

  const datasets = [
    {
      label: 'Drawdown',
      data: drawdowns,
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: '#ef4444',
      borderWidth: 2,
      fill: true,
    },
  ];

  return {
    labels,
    datasets,
    title: \`Drawdown Analysis (Max: $\${maxDrawdown.toFixed(2)})\`,
    xAxisLabel: 'Trade',
    yAxisLabel: 'Drawdown ($)',
  };
}
    `
  },
  {
    id: 'template-hold-time',
    name: 'Hold Time vs P&L',
    description: 'Analyze relationship between trade duration and profitability',
    chartType: 'scatter',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const tradesWithDuration = trades
    .filter(t => t.entryDate && t.exitDate && t.status === 'Closed')
    .map(t => {
      const entry = new Date(t.entryDate);
      const exit = new Date(t.exitDate);
      const durationHours = (exit.getTime() - entry.getTime()) / (1000 * 60 * 60);
      return {
        x: durationHours,
        y: t.pnl || 0,
        symbol: t.symbol,
      };
    });

  const datasets = [
    {
      label: 'Trades',
      data: tradesWithDuration,
      backgroundColor: tradesWithDuration.map(t => t.y >= 0 ? '#10b981' : '#ef4444'),
      borderColor: tradesWithDuration.map(t => t.y >= 0 ? '#10b981' : '#ef4444'),
      borderWidth: 2,
    },
  ];

  return {
    labels: [],
    datasets,
    title: 'Hold Time vs P&L',
    xAxisLabel: 'Duration (hours)',
    yAxisLabel: 'P&L ($)',
  };
}
    `
  },
];

export default chartTemplates;
