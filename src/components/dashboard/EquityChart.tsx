import React from 'react';
import { Trade } from '../../types';
import { generateEquityCurveData } from '../../utils/chartUtils';

interface EquityChartProps {
  trades: Trade[];
}

const EquityChart: React.FC<EquityChartProps> = ({ trades }) => {
  const equityData = generateEquityCurveData(trades);
  
  // Calcola i limiti per il grafico
  const values = equityData.map(d => d.value || 0);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const range = maxValue - minValue || 100; // Evita divisione per zero
  
  // Genera i punti SVG
  const svgWidth = 800;
  const svgHeight = 200;
  const padding = 50;
  const chartWidth = svgWidth - 2 * padding;
  const chartHeight = svgHeight - 2 * padding;
  
  const points = equityData.length > 0 
    ? equityData.map((point, index) => {
        const x = padding + (index / (equityData.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - (((point.value || 0) - minValue) / range) * chartHeight;
        return `${x},${y}`;
      }).join(' ')
    : `${padding},${svgHeight - padding} ${svgWidth - padding},${svgHeight - padding}`;

  return (
    <div className="equity-section">
      <h3>Equity Curve</h3>
      <div className="equity-chart-large">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {/* Linea dello zero */}
          {minValue < 0 && maxValue > 0 && (
            <line
              x1={padding}
              y1={padding + chartHeight - ((0 - minValue) / range) * chartHeight}
              x2={svgWidth - padding}
              y2={padding + chartHeight - ((0 - minValue) / range) * chartHeight}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          )}
          <polyline
            points={points}
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

export default EquityChart;
