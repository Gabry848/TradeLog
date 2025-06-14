import { Trade, CustomChartScript, ChartExecutionContext, CustomChartData, ChartMetrics } from '../types';
import { formatCurrency, formatDate } from './formatters';

// Funzioni di utilità disponibili negli script
export const createChartUtils = () => ({
  formatCurrency,
  formatDate,
    groupByMonth: (trades: Trade[]) => {
    const groups: { [month: string]: Trade[] } = {};
    trades.forEach(trade => {
      const dateToUse = trade.exitDate || trade.entryDate || trade.date;
      if (dateToUse) {
        const month = dateToUse.substring(0, 7);
        if (!groups[month]) groups[month] = [];
        groups[month].push(trade);
      }
    });
    return groups;
  },

  groupBySymbol: (trades: Trade[]) => {
    const groups: { [symbol: string]: Trade[] } = {};
    trades.forEach(trade => {
      if (!groups[trade.symbol]) groups[trade.symbol] = [];
      groups[trade.symbol].push(trade);
    });
    return groups;
  },

  groupByStrategy: (trades: Trade[]) => {
    const groups: { [strategy: string]: Trade[] } = {};
    trades.forEach(trade => {
      if (!groups[trade.strategy]) groups[trade.strategy] = [];
      groups[trade.strategy].push(trade);
    });
    return groups;
  },

  calculateMetrics: (trades: Trade[]): ChartMetrics => {
    const closedTrades = trades.filter(t => t.status === 'Closed');
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const winningTrades = closedTrades.filter(t => t.pnl > 0);
    const losingTrades = closedTrades.filter(t => t.pnl < 0);
    
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
    const profitFactor = avgLoss > 0 ? Math.abs(avgWin) / avgLoss : 0;

    // Calcolo del max drawdown
    let runningTotal = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    closedTrades
      .sort((a, b) => new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime())
      .forEach(trade => {
        runningTotal += trade.pnl;
        if (runningTotal > peak) {
          peak = runningTotal;
        }
        const drawdown = peak - runningTotal;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      });

    return {
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      totalTrades: closedTrades.length,
      profitFactor,
      maxDrawdown
    };
  }
});

// Funzione per eseguire uno script personalizzato in modo sicuro
export const executeChartScript = (
  script: CustomChartScript,
  trades: Trade[],
  parameters: { [key: string]: string | number | boolean }
): CustomChartData | null => {
  try {
    console.log('Executing script:', script.name);
    console.log('Trades count:', trades.length);
    console.log('Parameters:', parameters);

    // Crea il contesto di esecuzione
    const context: ChartExecutionContext = {
      trades,
      parameters,
      utils: createChartUtils()
    };

    // Crea una funzione sicura per eseguire lo script
    const scriptFunction = new Function('context', `
      const { trades, parameters, utils } = context;
      const { formatCurrency, formatDate, groupByMonth, groupBySymbol, groupByStrategy, calculateMetrics } = utils;
      
      ${script.code}
      
      return generateChart();
    `);

    // Esegue lo script nel contesto isolato
    const result = scriptFunction(context);
    
    console.log('Script execution result:', result);

    // Valida il risultato
    if (!result || !result.labels || !result.datasets) {
      console.error('Script result validation failed:', result);
      throw new Error('Lo script deve restituire un oggetto con proprietà labels e datasets');
    }

    return result as CustomChartData;
  } catch (error) {
    console.error('Errore nell\'esecuzione dello script:', error);
    console.error('Script code:', script.code);
    return null;
  }
};

// Script di esempio predefiniti
export const getDefaultChartScripts = (): CustomChartScript[] => [
  {
    id: 'test-simple',
    name: 'Test Semplice',
    description: 'Un test semplice per verificare che tutto funzioni',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  console.log('Test script executing...');
  console.log('Total trades:', trades.length);
  
  return {
    labels: ['Trade Totali', 'Trade Chiusi', 'Trade Aperti'],
    datasets: [{
      label: 'Conteggio',
      data: [
        trades.length,
        trades.filter(t => t.status === 'Closed').length,
        trades.filter(t => t.status === 'Open').length
      ],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(245, 158, 11, 0.8)'],
      borderColor: ['rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(245, 158, 11)'],
      borderWidth: 1
    }],
    title: 'Statistiche Trade',
    xAxisLabel: 'Categoria',
    yAxisLabel: 'Numero'
  };
}
`
  },
  {
    id: 'monthly-pnl',
    name: 'P&L Mensile',
    description: 'Mostra il profitto/perdita mensile',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [
      {
        id: 'showCumulative',
        name: 'Mostra Cumulativo',
        type: 'boolean',
        defaultValue: false,
        required: false,
        description: 'Mostra il P&L cumulativo invece di quello mensile'
      }
    ],
    code: `
function generateChart() {
  const monthlyGroups = groupByMonth(trades.filter(t => t.status === 'Closed'));
  const months = Object.keys(monthlyGroups).sort();
  
  const monthlyPnL = months.map(month => {
    return monthlyGroups[month].reduce((sum, trade) => sum + trade.pnl, 0);
  });
  
  let data = monthlyPnL;
  if (parameters.showCumulative) {
    let cumulative = 0;
    data = monthlyPnL.map(pnl => cumulative += pnl);
  }
  
  return {
    labels: months.map(month => formatDate(month + '-01')),
    datasets: [{
      label: parameters.showCumulative ? 'P&L Cumulativo' : 'P&L Mensile',
      data: data,
      backgroundColor: data.map(value => value >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
      borderColor: data.map(value => value >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
      borderWidth: 1
    }],
    title: parameters.showCumulative ? 'P&L Cumulativo per Mese' : 'P&L Mensile',
    xAxisLabel: 'Mese',
    yAxisLabel: 'P&L (€)'
  };
}
`
  },
  {
    id: 'symbol-distribution',
    name: 'Distribuzione per Simbolo',
    description: 'Mostra la distribuzione dei trade per simbolo',
    chartType: 'pie',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [
      {
        id: 'minTrades',
        name: 'Trade Minimi',
        type: 'number',
        defaultValue: 1,
        required: false,
        description: 'Numero minimo di trade per mostrare il simbolo'
      }
    ],
    code: `
function generateChart() {
  const symbolGroups = groupBySymbol(trades);
  const symbols = Object.keys(symbolGroups).filter(symbol => 
    symbolGroups[symbol].length >= parameters.minTrades
  );
  
  const colors = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(251, 146, 60, 0.8)'
  ];
  
  return {
    labels: symbols,
    datasets: [{
      label: 'Numero di Trade',
      data: symbols.map(symbol => symbolGroups[symbol].length),
      backgroundColor: colors.slice(0, symbols.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }],
    title: 'Distribuzione Trade per Simbolo',
  };
}
`
  },
  {
    id: 'win-rate-by-strategy',
    name: 'Win Rate per Strategia',
    description: 'Mostra il win rate per ogni strategia',
    chartType: 'bar',
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parameters: [],
    code: `
function generateChart() {
  const strategyGroups = groupByStrategy(trades.filter(t => t.status === 'Closed'));
  const strategies = Object.keys(strategyGroups);
  
  const winRates = strategies.map(strategy => {
    const strategyTrades = strategyGroups[strategy];
    const winningTrades = strategyTrades.filter(t => t.pnl > 0);
    return strategyTrades.length > 0 ? (winningTrades.length / strategyTrades.length) * 100 : 0;
  });
  
  return {
    labels: strategies,
    datasets: [{
      label: 'Win Rate (%)',
      data: winRates,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }],
    title: 'Win Rate per Strategia',
    xAxisLabel: 'Strategia',
    yAxisLabel: 'Win Rate (%)'
  };
}
`
  }
];
