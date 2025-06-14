import React from 'react';
import { formatPnL, formatPercentage } from '../../utils/formatters';

interface MetricCardProps {
  title: string;
  value: number;
  isPercentage?: boolean;
  showChart?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  isPercentage = false, 
  showChart = false 
}) => {
  // Genera un grafico dinamico basato sul valore
  const generateMiniChart = () => {
    const points: string[] = [];
    const baseY = 30;
    const amplitude = 15;
    
    for (let i = 0; i <= 10; i++) {
      const x = i * 18 + 10;
      // Simula un trend basato sul valore
      const trend = value >= 0 ? 1 : -1;
      const randomVariation = (Math.sin(i * 0.5) + Math.cos(i * 0.7)) * amplitude * 0.5;
      const trendEffect = (i / 10) * amplitude * trend * 0.7;
      const y = baseY - trendEffect + randomVariation;
      points.push(`${x},${Math.max(5, Math.min(55, y))}`);
    }
    
    return points.join(' ');
  };

  const chartColor = value >= 0 ? '#10b981' : '#ef4444';

  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <div className={`metric-value ${value >= 0 ? "positive" : "negative"}`}>
        {isPercentage ? formatPercentage(value) : formatPnL(value)}
      </div>
      {showChart && (
        <div className="chart-container">
          <svg className="equity-chart" viewBox="0 0 200 60">
            <defs>
              <linearGradient id={`miniGradient-${title.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area sotto la curva */}
            <polygon
              points={`10,55 ${generateMiniChart()} 190,55`}
              fill={`url(#miniGradient-${title.replace(/\s+/g, '')})`}
            />
            
            {/* Linea principale */}
            <polyline
              points={generateMiniChart()}
              fill="none"
              stroke={chartColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Punti sulla linea */}
            {generateMiniChart().split(' ').map((point, index) => {
              const [x, y] = point.split(',').map(Number);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill={chartColor}
                  opacity="0.8"
                />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
