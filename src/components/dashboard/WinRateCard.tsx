import React, { useState } from 'react';
import { Trade } from '../../types';
import { calculateDetailedWinRateStats } from '../../utils/chartUtils';
import { formatPercentage } from '../../utils/formatters';
import ChartTooltip from './ChartTooltip';
import '../../styles/tooltip.css';

interface WinRateCardProps {
  trades: Trade[];
}

const WinRateCard: React.FC<WinRateCardProps> = ({ trades }) => {
  const stats = calculateDetailedWinRateStats(trades);
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    data: [] as { label: string; value: string | number; color?: string }[],
  });
  // Genera un grafico del win rate nel tempo basato sui trade reali
  const generateWinRateChart = () => {
    if (stats.totalTrades === 0) return '';
    
    const points: string[] = [];
    const width = 180;
    const height = 50;
    const padding = 10;
      // Ordina i trade per data per calcolare il win rate progressivo
    const sortedTrades = [...trades]
      .filter(trade => trade.status === 'Closed')
      .sort((a, b) => new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime());
    
    if (sortedTrades.length === 0) {
      // Se non ci sono trade chiusi, mostra una linea piatta al 50%
      const y = height - padding - ((50 / 100) * (height - 2 * padding));
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i * (width - 2 * padding)) / 10;
        points.push(`${x},${y}`);
      }
      return points.join(' ');
    }
    
    // Calcola il win rate progressivo per punti lungo la timeline
    const numPoints = Math.min(11, sortedTrades.length + 1);
    for (let i = 0; i < numPoints; i++) {
      const x = padding + (i * (width - 2 * padding)) / (numPoints - 1);
      
      if (i === 0) {
        // Punto iniziale al 50%
        const y = height - padding - ((50 / 100) * (height - 2 * padding));
        points.push(`${x},${y}`);
      } else {
        // Calcola il win rate fino al trade i-esimo
        const tradesUpToIndex = sortedTrades.slice(0, i);
        const wins = tradesUpToIndex.filter(trade => (trade.pnl || 0) > 0).length;
        const winRate = (wins / tradesUpToIndex.length) * 100;
        const y = height - padding - ((winRate / 100) * (height - 2 * padding));
        points.push(`${x},${y}`);
      }
    }
    
    return points.join(' ');
  };

  const winRateColor = stats.winRate >= 50 ? '#10b981' : stats.winRate >= 40 ? '#f59e0b' : '#ef4444';
  const chartPoints = generateWinRateChart();

  const sortedTrades = [...trades]
    .filter(trade => trade.status === 'Closed')
    .sort((a, b) => new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime());

  const handlePointHover = (event: React.MouseEvent, index: number) => {
    if (index === 0) {
      // Punto iniziale
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: [
          { label: 'Position', value: 'Start' },
          { label: 'Win Rate', value: '50.0%', color: '#6b7280' },
        ],
      });
    } else if (sortedTrades[index - 1]) {
      const tradesUpToIndex = sortedTrades.slice(0, index);
      const wins = tradesUpToIndex.filter(trade => (trade.pnl || 0) > 0).length;
      const winRate = (wins / tradesUpToIndex.length) * 100;
      const trade = sortedTrades[index - 1];

      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: [
          { label: 'After Trade', value: `#${index}` },
          { label: 'Symbol', value: trade.symbol },
          { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, color: winRateColor },
          { label: 'Total Trades', value: tradesUpToIndex.length },
          { label: 'Wins', value: wins, color: '#10b981' },
          { label: 'Losses', value: tradesUpToIndex.length - wins, color: '#ef4444' },
        ],
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };
  return (
    <div className="win-rate-card">
      <h3>Win Rate</h3>
      
      <div className="win-rate-content">
        <div className={`win-rate-value ${stats.winRate >= 50 ? 'positive' : stats.winRate >= 40 ? 'neutral' : 'negative'}`}>
          {formatPercentage(stats.winRate, 1)}
        </div>

        {stats.totalTrades > 0 && (
          <div className="win-rate-chart">
            <svg viewBox="0 0 200 60" className="chart-svg">
              <defs>
                <linearGradient id="winRateGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={winRateColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={winRateColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area sotto la curva */}
              {chartPoints && (
                <polygon
                  points={`10,55 ${chartPoints} 190,55`}
                  fill="url(#winRateGradient)"
                />
              )}
              
              {/* Linea del 50% (break-even) */}
              <line
                x1="10"
                y1="35"
                x2="190"
                y2="35"
                stroke="#6b7280"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.5"
              />
              
              {/* Linea principale */}
              {chartPoints && (
                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke={winRateColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              
              {/* Punti sulla linea */}
              {chartPoints && chartPoints.split(' ').map((point, index) => {
                const [x, y] = point.split(',').map(Number);
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={winRateColor}
                    stroke="white"
                    strokeWidth="1"
                    className="chart-point-interactive"
                    onMouseEnter={(e) => handlePointHover(e, index)}
                    onMouseMove={(e) => handlePointHover(e, index)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}            </svg>
            <ChartTooltip
              x={tooltip.x}
              y={tooltip.y}
              visible={tooltip.visible}
              data={tooltip.data}
            />
          </div>
        )}
      </div>

      {stats.totalTrades === 0 && (
        <div className="no-data">
          <p>Nessun trade chiuso disponibile</p>
        </div>
      )}
    </div>
  );
};

export default WinRateCard;
