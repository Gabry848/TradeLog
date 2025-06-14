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
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <div className={`metric-value ${value >= 0 ? "positive" : "negative"}`}>
        {isPercentage ? formatPercentage(value) : formatPnL(value)}
      </div>
      {showChart && (
        <div className="chart-container">
          <svg className="equity-chart" viewBox="0 0 200 60">
            <polyline
              points="10,50 30,45 50,40 70,35 90,30 110,25 130,20 150,15 170,10 190,5"
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
