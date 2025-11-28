import React from 'react';
import { Trade } from '../../types';
import { calculateDetailedWinRateStats } from '../../utils/chartUtils';
import { formatPercentage } from '../../utils/formatters';

interface WinRateCardProps {
  trades: Trade[];
}

const WinRateCard: React.FC<WinRateCardProps> = ({ trades }) => {
  const stats = calculateDetailedWinRateStats(trades);
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
                    r="3"
                    fill={winRateColor}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })}            </svg>
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
